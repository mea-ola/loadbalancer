# loadbalancer
Pulls from marathon host, updates nginx conf, then reloads. Will add server definition with the domain as the domain label of the deployed job.
```
"app" {
  ...
  "labels": {
    "public": "true", // <- quoted due to a bug in marathon
    "domain": "meaola.dc.timbrook.im"
  }
  ...
}

```
