# tranca?

Site estático que responde uma pergunta que o SIGA da UFRJ se recusa a responder de forma decente:

> a partir das matérias que eu já fiz, o que eu posso cursar agora, o que ainda está trancado, e o que falta pra destrancar cada coisa?

Sem backend, sem login. Você marca o que já cursou, o site calcula o resto e guarda tudo no seu navegador (`localStorage`).

## Rodando localmente

Não precisa de build. É HTML/CSS/JS puro.

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

## Publicando no GitHub Pages

1. Suba este repositório pra `github.com/Sgcont/<nome-do-repo>`
2. Nas configurações do repo: **Settings → Pages → Source: branch `main`, pasta `/ (root)`**
3. Em alguns minutos o site fica em `https://sgcont.github.io/<nome-do-repo>/`

## Estrutura

```
index.html
style.css
app.js
data/
  index.json                    # lista de currículos disponíveis
  courses/
    ciencias-atuariais.json     # grade de um curso
```

## Adicionando o currículo de outro curso

Isso é o que faz o projeto valer pra "qualquer um", não só pra um curso. Pra adicionar um curso novo:

1. Vá no [SIGA](https://www.siga.ufrj.br) → **Distribuição Curricular** do curso desejado, e tire prints (ou copie a tabela) de todos os períodos, igual foi feito aqui.
2. Crie `data/courses/<slug-do-curso>.json` seguindo o formato abaixo.
3. Adicione uma entrada em `data/index.json`.
4. Abra um PR.

### Formato de `data/courses/<slug>.json`

```json
{
  "id": "slug-do-curso",
  "nome": "Nome do Curso",
  "instituicao": "Instituto - UFRJ",
  "disciplinas": [
    {
      "codigo": "ICP121",
      "nome": "Computação I",
      "periodo": 1,
      "creditos": 4.0,
      "cht": 45, "chp": 15, "che": 0,
      "requisitos": []
    },
    {
      "codigo": "MAC123",
      "nome": "Cálculo II",
      "periodo": 2,
      "creditos": 5.0,
      "cht": 60, "chp": 30, "che": 0,
      "requisitos": [
        {
          "tipo": "P",
          "alvo": "MAC113",
          "opcoes": [["MAW111", "MAW121"], ["MAC118"], ["MAE111"]]
        }
      ]
    }
  ]
}
```

**Como ler a coluna "Requisitos" do SIGA:**

- `CODIGO (P)` = pré-requisito (precisa ter sido **aprovado antes**)
- `CODIGO (C)` = co-requisito (pode cursar **junto**)
- Linhas `CODIGO = OUTRO` logo abaixo são **equivalências**: formas alternativas de satisfazer aquele requisito. Quando aparece `CODIGO = A + B`, significa que A **e** B juntos valem como equivalente (`opcoes` recebe `["A", "B"]` no mesmo array).
- Cada linha `=` diferente é uma alternativa nova (**ou** uma **ou** outra) → cada uma vira um array separado dentro de `opcoes`.
- O `alvo` às vezes é um código que não existe no currículo do seu curso (é de outro curso/currículo antigo) — normal, é só o "nome interno" que o SIGA usa pro requisito. Uma das opções de equivalência costuma ser a disciplina real do seu curso.
- `periodo` pode ser um número ou a string `"optativa"` para disciplinas de escolha condicionada/livre.

O app resolve isso sozinho: uma disciplina fica **livre** quando, pra cada requisito do tipo `P`, o próprio `alvo` ou algum grupo de `opcoes` já foi todo marcado como concluído.

### O que não é modelado (de propósito)

- "Atividades Acadêmicas Optativas" (bolsões genéricos de crédito, não uma disciplina específica) não entram na lista.
- Requisitos cujo `alvo` não existe no currículo e que não têm nenhuma opção interna ficam marcados como equivalência externa — o app não trava a disciplina por causa deles, só avisa no painel de detalhe.

## Aviso

Dados extraídos manualmente do SIGA em 2026. Sem vínculo oficial com a UFRJ. Pode ter erro de transcrição — currículo muda, sempre confirme decisões de matrícula com a coordenação do seu curso. Achou algo errado? Abre uma issue ou manda um PR.
