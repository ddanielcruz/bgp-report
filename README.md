![GitHub release (latest by date)](https://img.shields.io/github/v/release/danielccunha/bgp-report?color=%233a86ff)
[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg?color=%233a86ff)](https://opensource.org/licenses/)
![GitHub last commit](https://img.shields.io/github/last-commit/danielccunha/bgp-report?color=3a86ff)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/1e22be0695da4a608eb7f3846f6b9709)](https://www.codacy.com/gh/danielccunha/bgp-report/dashboard?utm_source=github.com&utm_medium=referral&utm_content=danielccunha/bgp-report&utm_campaign=Badge_Grade)

# BGP Report

Aplicação backend do projeto BGP Report, uma ferramenta para análise e visualização de roteadores BGP. A solução desenvolvida faz parte do meu trabalho de conclusão do curso de Ciência da Computação, orientado pelo professor [Ricardo Schmidt](https://www.escavador.com/sobre/2791800/ricardo-de-oliveira-schmidt).

## Instalação

Antes de configurar a aplicação, é necessário instalar em sua máquina [Node.js][nodejs] e Docker. O segundo é opcional, e é utilizado apenas para criação do banco de dados. Após instalado, execute os seguintes comandos:

```sh
# Clonando o  repositório
$ git clone https://github.com/danielccunha/bgp-report.git
$ cd bgp-report

# Criando o banco de dados
$ sh ./scripts/create-database.sh

# Clonando e preenchendo as variáveis de ambiente
$ cp .env.example .env
$ nano .env

# Instalação as dependências
$ yarn install
```

## Utilização

Para iniciar a aplicação em modo de desenvolvimento basta executar o comando `yarn dev`. Para iniciar em modo de produção, execute o comando `yarn build` para compilar o projeto, e inicie com o comando `yarn start`.

Após iniciado o projeto, navegue para http://localhost:3333 para abrir a documentação do projeto com o Swagger. Outra opção é a coleção do Insomnia encontrada na pasta `docs`, possuindo todos os endpoints do projeto.

## Licença

Esse projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

[nodejs]: https://nodejs.org/en/
[docker]: https://www.docker.com/
