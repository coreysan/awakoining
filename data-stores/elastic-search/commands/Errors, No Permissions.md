If you're getting a "no write access" error when interacting with ES:
```
PUT .kibana/_settings
{
  "index": {
    "blocks": {
      "read_only_allow_delete": "false"
    }
  }
}
```