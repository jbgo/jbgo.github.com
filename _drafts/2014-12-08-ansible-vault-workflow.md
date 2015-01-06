---
layout: post
title: Ansible vault workflow
---

Ansible vault allows you to encrpyt/decrypt files containing sensitive data
like passwords, API keys, etc. The Ansible documentation provides a good
[overview of vault](http://docs.ansible.com/playbooks_vault.html) features
but fails to comment on a realistic production workflow.

What do I mean by realistic production workflow? It means that I don't have
to think about it, I don't have to train it, and I don't have to worry about
accidentally screwing something up like forgetting to encrypt a file that
should be encrypted.

1. In your ansible repository, generate your vault password and save it to a file.

`openssl rand -base64 4096 > .vault-password`

2. Add your password to .gitignore so you don't accidentally check it in.

`echo .vault-password >> .git/ignore`

3. Install a git pre-commit hook that will encrypt senstive files before saving
them to source control.

TODO

4. Install some other hook to decrypt sensitive files.

TODO

