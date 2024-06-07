import https from 'https';

const REQUEST_CACHE_EXPIRY = 60000; 
const MAX_REQUESTS_PER_MINUTE = 10;
const requestCache = {};

function cleanRequestCache() {
    const now = Date.now();
    Object.keys(requestCache).forEach(timestamp => {
        if (now - timestamp >= REQUEST_CACHE_EXPIRY) {
            delete requestCache[timestamp];
        }
    });
}

export async function handler(event) {
   let cep, service;

    if (event.body) {
        const requestBody = JSON.parse(event.body); 
        cep = requestBody.cep;
        service = requestBody.service;
    } else {
        cep = event.cep;
        service = event.service;
    }

    if (!cep || !/^(\d{5}-\d{3}|\d{8})$/.test(cep)) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Por favor, forneça um CEP válido.' })
        };
    }

    if (!service || !['viacep', 'cepaberto'].includes(service.toLowerCase())) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Por favor, especifique um serviço de consulta de CEP válido: "viacep" ou "cepaberto".' })
        };
    }

    cleanRequestCache();

    const now = Date.now();
    const recentRequests = Object.keys(requestCache).filter(timestamp => now - timestamp < REQUEST_CACHE_EXPIRY);
    
    if (recentRequests.length >= MAX_REQUESTS_PER_MINUTE) {
        return {
            statusCode: 429,
            body: JSON.stringify({ error: 'Limite de solicitações excedido. Tente novamente mais tarde.' })
        };
    }

    requestCache[now] = true;

    try {
        let apiUrl;
        let options = {};
        switch (service.toLowerCase()) {
            case 'viacep':
                apiUrl = `https://viacep.com.br/ws/${cep}/json/`;
                break;
            case 'cepaberto':
                apiUrl = `https://www.cepaberto.com/api/v3/cep?cep=${cep}`;
                options = {
                    headers: {
                        'Authorization': 'Token 654d724dda902ee400c878f8e361eb16'
                    }
                };
                break;
        }

        const response = await new Promise((resolve, reject) => {
            const req = https.get(apiUrl, options, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    if (res.headers['content-type'] && res.headers['content-type'].includes('application/json')) {
                        resolve({ status: res.statusCode, data: JSON.parse(data) });
                    } else {
                        reject(new Error('Resposta não está em formato JSON'));
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.end();
        });

        if (response.status === 404) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'CEP não encontrado.' })
            };
        } else {
            console.log('Resposta da API:', response);

            let formattedResponse;
            if (service.toLowerCase() === 'viacep') {
                const { logradouro, localidade, uf, bairro, complemento } = response.data;
                if (!logradouro || !localidade || !uf) {
                    return {
                        statusCode: 500,
                        body: JSON.stringify({ error: 'Dados de resposta inválidos.', data: response.data })
                    };
                }
                formattedResponse = {
                    cep,
                    logradouro,
                    complemento: complemento || '',
                    bairro: bairro || '',
                    localidade,
                    uf
                };
            } else if (service.toLowerCase() === 'cepaberto') {
                const { logradouro, bairro, cidade, estado, complemento, altitude, latitude, longitude} = response.data;
                if (!logradouro || !bairro || !cidade || !estado) {
                    return {
                        statusCode: 500,
                        body: JSON.stringify({ error: 'Dados de resposta inválidos.', data: response.data })
                    };
                }
                formattedResponse = {
                    altitude,
                    cep,
                    latitude,
                    longitude,
                    logradouro,
                    bairro,
                    complemento: complemento || '',
                    cidade,
                    estado
                };
            }

            return {
                statusCode: 200,
                body: JSON.stringify(formattedResponse)
            };
        }

    } catch (error) {
        console.error('Erro ao processar a requisição:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: `Erro ao processar a requisição: ${error.message}` })
        };
    }
}
