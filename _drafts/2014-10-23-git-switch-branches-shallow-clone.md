---
layout: post
title: Switching branches on a shallow git clone
---

Because I'm only interest in the most recent version of a project,
I clone a shallow git repo. If the project has a ton of history -
thousands and thousands of commits - this saves me a lot of time
because the initial download is much faster.

```
git clone --depth=1 git@github.com:ansible/ansible.git
```

However, after some time I become interested in another branch,
and I want to check it out. But this doesn't appear to work.

```
[ 6:27:49] ../ansible (devel) $ git checkout -t origin/release1.7.2
fatal: Cannot update paths and switch to branch 'release1.7.2' at the same time.
Did you intend to checkout 'origin/release1.7.2' which can not be resolved as commit?
```

Looking at `.git/config` for this repo, I see that because we cloned
this repo with `--depth=1` we are only set up to fetch a single branch.
(See the `--[no-]single-branch` option in `git help clone`.)

```
[remote "origin"]
  url = git@github.com:ansible/ansible.git
  fetch = +refs/heads/devel:refs/remotes/origin/devel
```

When you do a normal git clone, the remote definition typically uses
a wildcard `*` instead of specifying the branch.

```
[ 6:51:50] ../ansible (devel) $ git remote set-branches origin release1.7.2
```

```
[remote "origin"]
  url = git@github.com:ansible/ansible.git
  fetch = +refs/heads/release1.7.2:refs/remotes/origin/release1.7.2
```

Now we can fetch a different remote branch and even specify `--depth=1`.
Then we can checkout this branch as a tracking branch.

```
[ 6:36:39] ../ansible (devel) $ git fetch --depth=1 origin release1.7.2
remote: Counting objects: 518, done.
remote: Compressing objects: 100% (478/478), done.
remote: Total 518 (delta 184), reused 102 (delta 9)
Receiving objects: 100% (518/518), 714.95 KiB | 1.07 MiB/s, done.
Resolving deltas: 100% (184/184), completed with 159 local objects.
From github.com:ansible/ansible
 * branch            release1.7.2 -> FETCH_HEAD
 * [new branch]      release1.7.2 -> origin/release1.7.2
[ 6:36:50] ../ansible (devel) $ git checkout release1.7.2
Branch release1.7.2 set up to track remote branch release1.7.2 from origin.
Switched to a new branch 'release1.7.2'
[ 6:36:59] ../ansible (release1.7.2) $
```

```
git remote set-branches origin release1.7.2


That's pretty cool! But why would I ever need to do this?

Well, I created an ansible playbook that used the [git module]() with
a `depth=1` option. Now When I try to switch branches I get the following error:

```
TODO: error
```

It turns out that it's because of the way git handles shallow clones, ansible
can't checkout this repo the normal way.

Here is my pull request for resolving this issue: ...
