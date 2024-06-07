# Serviço de Consulta de CEP da AWS Lambda

Este projeto consiste em uma função AWS Lambda escrita em Node.js que fornece um serviço de consulta de CEP. A função é capaz de buscar informações de endereço associadas a um determinado CEP utilizando dois serviços: ViaCEP e CepAberto.

## Recursos

- Suporta dois serviços de consulta de CEP: ViaCEP e CepAberto.
- Implementa limitação de taxa para evitar abusos do serviço.
- Armazena em cache as solicitações recentes para melhorar o desempenho e reduzir solicitações redundantes.
- Validação do formato do CEP fornecido na solicitação.
- Tratamento de erros e retorno de mensagens apropriadas em caso de solicitação inválida ou falha na consulta do CEP.
- Conversão dos dados de resposta para um formato padronizado antes de enviar a resposta ao cliente.

## Como Usar

Para utilizar o serviço de consulta de CEP, você pode enviar uma solicitação HTTP para o endpoint da função Lambda. O endpoint está disponível em:
https://rfpz6ql3l2yeyio5lchhshes4q0pipro.lambda-url.us-east-2.on.aws/

## Formato da Solicitação

**Método HTTP**: O método HTTP utilizado para fazer a solicitação é o POST.

```json
{
  "cep": "01001000",
  "service": "viacep"
}
```

```json
{
  "cep": "01001000",
  "service": "cepaberto"
}
```

Neste exemplo, o campo "cep" representa o CEP que você deseja consultar e o campo "service" indica o serviço de consulta de CEP a ser utilizado (no caso, "cepaberto" ou "viacep"). Certifique-se de preencher esses campos com os valores apropriados ao fazer uma solicitação para o serviço.

## Fontes externas

Este projeto faz uso dos serviços de consulta de CEP fornecidos pela [ViaCEP](https://viacep.com.br/) e [CepAberto](https://cepaberto.com/).
