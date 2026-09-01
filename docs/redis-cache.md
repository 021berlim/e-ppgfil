# Cache Redis com limite de 30 MB

O Redis e uma otimizacao opcional. Configure `REDIS_URL` com a URL TLS (`rediss://`) do Redis Cloud. Sem a variavel, com Redis indisponivel ou diante de OOM, todas as leituras continuam no PostgreSQL e erros de escrita de cache sao apenas registrados como aviso.

## Entradas selecionadas

| Chave | Estrutura | Conteudo | TTL | Invalidacao |
| --- | --- | --- | --- | --- |
| `d:c` | String binaria zlib | Catalogo de categorias, tipos e documentos exigidos | 300 s | Imediata apos substituir o catalogo |
| `d:r` | Hash | Quatro cargos do dashboard, com campos compactos | 300 s | TTL (nao ha mutacao de cargos na aplicacao) |
| `s:<hash>` | Hash | ID, email, nome, URL pequena de avatar e cargo da sessao | 30 s | Logout e mutacoes do usuario/perfil |
| `u:<id>` | Set | Indice temporario das chaves de sessao; UUID convertido para 22 caracteres | 35 s | Mutacoes do usuario/perfil |

O catalogo comprimido so e gravado se tiver no maximo 64 KiB. Sessoes so sao gravadas se os campos somarem no maximo 4 KiB; isso exclui automaticamente avatares `data:` grandes. Protocolos, auditoria, documentos, HTML, respostas renderizadas e listagens administrativas completas nao sao armazenados.

No plano gratuito, configure a politica de eviction como `allkeys-lru` quando essa opcao estiver disponivel. Todos os itens da aplicacao possuem TTL, mas a eviction oferece uma segunda protecao antes do limite de memoria.
