# Destrava UFRJ

Uma ferramenta simples para entender melhor o seu currículo da UFRJ.

Você já olhou para o SIGA e ficou tentando descobrir **quais disciplinas pode cursar agora**, **quais ainda estão bloqueadas** e **o que falta para liberar cada uma**?

Foi pensando nisso que surgiu o **Destrava UFRJ**.

O projeto transforma a distribuição curricular do curso em uma interface interativa. Você marca as disciplinas que já concluiu e o sistema verifica automaticamente quais matérias estão disponíveis, quais continuam bloqueadas e quais pré-requisitos ainda faltam.

A ideia é tornar uma informação que normalmente fica espalhada em tabelas do SIGA muito mais fácil de visualizar.

> **Marque o que você já fez. O Destrava mostra o que vem depois.**

## Como funciona?

O projeto é totalmente **frontend**:

* Você escolhe o currículo do seu curso.
* Marca as disciplinas que já concluiu.
* O sistema analisa os pré-requisitos.
* As disciplinas disponíveis são liberadas automaticamente.
* As disciplinas bloqueadas mostram o que ainda falta.
* Seu progresso fica salvo no próprio navegador usando `localStorage`.

Não existe backend, banco de dados, login ou cadastro.

Os currículos são armazenados em arquivos `.json`, o que também facilita adicionar novos cursos.

## Tecnologias

* HTML
* CSS
* JavaScript
* JSON
* `localStorage`
* GitHub Pages

## Rodando localmente

Não é necessário instalar dependências ou fazer um build.

Basta clonar o repositório e iniciar um servidor HTTP simples:

```bash
git clone https://github.com/Sgcont/<nome-do-repo>.git
cd <nome-do-repo>

python3 -m http.server 8000
```

Depois, abra:

```text
http://localhost:8000
```

Também é possível usar a extensão **Live Server** do VS Code ou qualquer outro servidor HTTP local.

## Publicando no GitHub Pages

O projeto pode ser hospedado diretamente pelo GitHub Pages.

1. Faça o push do projeto para `github.com/Sgcont/<nome-do-repo>`.
2. No repositório, acesse **Settings → Pages**.
3. Em **Build and deployment**, selecione:

   * **Source:** Deploy from a branch
   * **Branch:** `main`
   * **Folder:** `/ (root)`
4. Salve as configurações.

Depois da publicação, o projeto estará disponível em:

```text
https://sgcont.github.io/<nome-do-repo>/
```

## Estrutura do projeto

```text
.
├── index.html
├── style.css
├── app.js
│
└── data/
    ├── index.json
    │
    └── courses/
        └── ciencias-atuariais.json
```

### `data/index.json`

Contém a lista de currículos disponíveis no projeto.

### `data/courses/`

Cada arquivo representa o currículo de um curso.

Isso permite que o mesmo sistema seja utilizado para diferentes graduações sem precisar alterar a lógica principal da aplicação.

---

# Adicionando um novo curso

Uma das ideias principais do projeto é que ele **não seja limitado a um único curso**.

Para adicionar um novo currículo:

### 1. Consulte o SIGA

No [SIGA da UFRJ](https://www.siga.ufrj.br/), procure a **Distribuição Curricular** do curso desejado.

A partir dela, obtenha as disciplinas, períodos, créditos e requisitos do currículo.

### 2. Crie o arquivo do curso

Adicione um novo arquivo em:

```text
data/courses/<slug-do-curso>.json
```

Por exemplo:

```text
data/courses/ciencia-da-computacao.json
```

### 3. Adicione o curso ao índice

Registre o novo currículo em:

```text
data/index.json
```

### 4. Teste o currículo

Confira principalmente os pré-requisitos e equivalências.

### 5. Abra um Pull Request

Se você encontrou algum currículo que ainda não está no projeto, fique à vontade para contribuir.

---

# Formato dos currículos

Cada currículo segue uma estrutura semelhante a esta:

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
      "cht": 45,
      "chp": 15,
      "che": 0,
      "requisitos": []
    },
    {
      "codigo": "MAC123",
      "nome": "Cálculo II",
      "periodo": 2,
      "creditos": 5.0,
      "cht": 60,
      "chp": 30,
      "che": 0,
      "requisitos": [
        {
          "tipo": "P",
          "alvo": "MAC113",
          "opcoes": [
            ["MAW111", "MAW121"],
            ["MAC118"],
            ["MAE111"]
          ]
        }
      ]
    }
  ]
}
```

## Entendendo os requisitos

A distribuição curricular do SIGA possui diferentes tipos de requisitos.

### Pré-requisito `(P)`

A disciplina precisa ter sido **concluída anteriormente**.

```text
MAC113 (P)
```

significa que o aluno precisa ter sido aprovado em `MAC113` antes de cursar a disciplina.

### Co-requisito `(C)`

A disciplina pode ser cursada **simultaneamente** com o requisito.

### Equivalências

O SIGA pode apresentar alternativas para satisfazer um determinado requisito.

Por exemplo:

```text
MAC113 = MAW111 + MAW121
```

significa que `MAW111` **e** `MAW121`, juntos, podem satisfazer aquele requisito.

Já diferentes linhas de equivalência representam alternativas:

```text
MAC113 = MAC118
MAC113 = MAE111
```

Nesse caso, qualquer uma das alternativas pode satisfazer o requisito.

No JSON, isso é representado por diferentes grupos dentro de `opcoes`.

O sistema interpreta essas combinações automaticamente para determinar se uma disciplina está liberada.

## Requisitos externos

Alguns requisitos encontrados no SIGA podem apontar para códigos que não aparecem diretamente no currículo daquele curso.

Isso pode acontecer porque o requisito pertence a outro currículo ou utiliza um código interno diferente.

Quando existe uma equivalência conhecida dentro do próprio currículo, ela pode ser adicionada normalmente.

Quando não existe, o projeto trata esse requisito como uma **equivalência externa** e não bloqueia automaticamente a disciplina por causa dele. Em vez disso, essa informação é apresentada ao usuário para conferência.

---

# O que o projeto não modela

Algumas informações do currículo não são representadas como disciplinas individuais.

Por enquanto, o projeto não modela:

* **Atividades Acadêmicas Optativas** como disciplinas específicas;
* bolsões genéricos de créditos;
* situações que dependam de regras administrativas específicas do curso;
* alterações curriculares que não estejam presentes nos dados cadastrados.

A intenção é manter o sistema simples e focado na pergunta principal:

> **"Com o que eu já fiz, o que posso cursar agora?"**

---

# Contribuindo

Encontrou um erro em um currículo? Conhece um curso que ainda não está disponível?

Contribuições são bem-vindas.

Você pode:

* abrir uma **Issue**;
* corrigir um currículo;
* adicionar um novo curso;
* melhorar a interface;
* melhorar a lógica de requisitos;
* sugerir novas funcionalidades.

O projeto foi pensado para crescer junto com a comunidade de estudantes.

---

# Aviso

Os dados dos currículos foram **extraídos manualmente do SIGA em 2026**.

Este projeto **não possui vínculo oficial com a UFRJ** e os dados podem conter erros de transcrição ou ficar desatualizados caso os currículos sejam alterados.

O resultado apresentado pelo sistema deve ser usado como uma ferramenta de consulta e organização, **não como confirmação oficial de matrícula**.

Antes de tomar uma decisão acadêmica, confirme os requisitos e as regras de matrícula no SIGA e, quando necessário, com a coordenação do seu curso.

Se encontrar alguma informação incorreta, abra uma Issue ou envie um Pull Request para ajudar a manter os currículos atualizados.
