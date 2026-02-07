# Lesson Schema

This package defines the JSON schema used for all Typing Code Learn lessons.

## Schema File

- `lesson.schema.json` — JSON Schema (Draft 07) for lesson files.

## Lesson Properties

| Property      | Type     | Required | Description                                  |
|---------------|----------|----------|----------------------------------------------|
| `id`          | string   | ✅       | Unique ID (e.g., `go-variables-01`)          |
| `title`       | string   | ✅       | Human-readable title                         |
| `language`    | string   | ✅       | Programming language (`go`, `javascript`...) |
| `concept`     | string   | ✅       | Concept taught                               |
| `description` | string   | ✅       | Brief description                            |
| `explanation` | string[] | ✅       | Step-by-step explanation                     |
| `code`        | string   | ✅       | Code to type                                 |
| `mode`        | string   | ✅       | `strict` or `practice`                       |
| `difficulty`  | string   | ✅       | `beginner`, `intermediate`, `advanced`       |
| `order`       | integer  | ❌       | Sort order within category                   |
| `hints`       | string[] | ❌       | Optional hints                               |
| `tags`        | string[] | ❌       | Tags for categorization                      |

## Example

```json
{
  "id": "go-variables-01",
  "title": "Variables en Go",
  "language": "go",
  "concept": "variables",
  "description": "Aprende a crear una variable simple en Go.",
  "explanation": [
    "En Go usamos 'var' para declarar variables.",
    "Una variable guarda un valor en memoria."
  ],
  "code": "var age = 25\nfmt.Println(age)",
  "mode": "strict",
  "difficulty": "beginner",
  "order": 1
}
```
