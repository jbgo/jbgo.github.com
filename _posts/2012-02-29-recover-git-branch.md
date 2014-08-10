---
layout: post
title: Recover a git branch you accidentally deleted
---

It's 5pm Friday, you're ready to go home for the weekend, and oh crap! You just deleted the git branch you've been working out of all week long. You never bothered to push your branch to a remote repository, so all of your work is just lost, LOST! FOREVER!

Or not.

This happened to a coworker of mine today (it just as easily happen to me). Here's how I bailed him out.

### 1. Create a list of all dangling or unreachable commits.

```sh
$ git fsck --full --no-reflogs --unreachable --lost-found
unreachable tree 4a407b1b09e0d8a16be70aa1547332432a698e18
unreachable tree 5040d8cf08c78119e66b9a3f8c4b61a240229259
unreachable tree 60c0ce61b040f5e604850f747f525e88043dae12
unreachable tree f080522d06b9853a2f18eeeb898724da4af7aed9
unreachable blob bf01f514add2ada00a7ae5c666493d30d639018c
...
```

These commits are copied into `.git/lost-found/commit/`, and non-commit objects are copied into `.git/lost-found/other/`.

### 2. Print a list of commit messages for all commits in the lost and found.

```sh
$ ls -1 .git/lost-found/commit/ | xargs -n 1 git log -n 1 --pretty=oneline
63b65d3784b16f92bb370ad6a2c1091a05824ecc Call #to_s on value before calling some string methods, like gsub
6ed99e63db69ca04f0cc78081a1fd471289551b2 On master: search and reset page
973d9be3e2cefcd0c5801ad9cd1b2e18774b4bee Rename decorator proxy to decorator context
9ae38fc6b0548cab08ccee1178db0ba0edeafdb2 foo
9e994ca0c0c4785ab45bf64b367fdacccc4575a9 foo [#12345]
9efa6b28b3b0a89c312484f28cf589385d613dfd On master: mysql db config
c57a67c7e1c21fa0c32f152e73d8c3376cad19a0 bar
cb3d67e1aa2226ab9d816fc541f36ff698bfda41 WIP on master: 40a4453 Use #website_url instead of #template_url or #url
def0a251bd29b7fc54a5622e364711f60097b826 Example tabs for export show page (no styles)w
```

### 3. Find your missing commit through the process of manual inspection (i.e. reading).

If you need more information on a commit, you can always use a more detailed log command, such as `git log -p --stat --color 9ae38fc`.

### 4. Create a new branch with the missing commit as the branch head.

```sh
$ git checkout -b branch-name 9ae38fc
Switched to a new branch 'branch-name'
```

There are a few comments on the [original gist](https://gist.github.com/jbgo/1944238) that offer alternatives to this approach.
