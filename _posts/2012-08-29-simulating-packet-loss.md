---
layout: post
title: Simulating Packet Loss
---

## Why?

A small percentage of users were complaining about uploads failing for no apparent reason. After some time investigating the issue, I suspected an unreliable network connection on the users' home computers might be responsible for these failures. To test my theory, I wanted to simulate random packet loss on my development machine to reproduce the failures.

## How?

I used a program called `ipfw` to simulate packet loss. From the manual, `ipfw` is an "IP firewall and traffic shaper control program."

It wasn't immediately obvious how to use this program at first, so here is a summary of what I did. Also, the man page tells me it's deprecated, but it worked for me today.

To simulate packet loss you can add a new rule:

```
$ sudo ipfw add prob 0.001 drop ip from me to any
00100 prob 0.001000 deny ip from me to any
```

- `ipfw add` - adds a new rule
- `prob 0.001` - 0.1% probability this rule will be applied to a packet
- `drop` - drop the packet when the rule matches
- `ip from me to any` - applies to IP packets leaving my machine (going from me to any other host). In this case, I only wanted to drop packets while sending data.

Just to make sure that worked, let's look at the rules defined. 

```
$ sudo ipfw show
00100      0         0 prob 0.001000 deny ip from me to any
65535 250132 162057706 allow ip from any to any
```

As you can see, the new rule is number 100 (shown as 00100), and the default rule is number 65535.

At this point, I am guessing that you do not want to permanently cripple your internet connection, so it would be nice to remove the packet dropping rule when you finish testing. Knowing that it is rule number 100, you can delete it like this.

```
$ sudo ipfw delete 100
$ sudo ipfw show
65535 250384 162139203 allow ip from any to any
```

Did this allow me to reproduce the failure? Yes. Was there anything I could do about it? Not really, I don't controller users' home internet connections.
