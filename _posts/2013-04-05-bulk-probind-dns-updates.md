---
layout: post
title: Bulk ProBIND DNS Updates
---

At work today, I needed to change the IP address for hundreds of A records
in a pre-existing ProBIND installation. I dreaded spending hours clicking
through the GUI. Who has time for that! Since ProBIND is basically a CRUD
app for a few tables in MySQL, I was able to run some bulk update queries
to change all the records, then click the "Push Updates" button in the GUI
to update the zone files and push them out to our name servers. In case
you find yourself in the same scenario, this is how I did it.

## 1. Given a list of domains, preview the records you want to update.

```sql
select zones.id, zones.domain, zones.updated, records.id, records.zone, records.domain, records.type, records.data from records
inner join zones on zones.id = records.zone
where (records.domain = '@' or records.domain = 'www') and records.type = 'A' and records.data = '123.ip.add.rss'
  and records.zone in (select id from zones where domain in ('a.list', 'of.domains', 'to.update'));
```

You probably need to adjust this query to match your specific requirements.

## 2. Update the matching records.

The number of records updated should match the number of rows returned in query #1.

```sql
update records set data = '123.the.new.ip', mtime = now()
where (records.domain = '@' or records.domain = 'www') and records.type = 'A' and records.data = '123.ip.add.rss'
  and records.zone in (select id from zones where domain in ('a.list', 'of.domains', 'to.update'));
```

It's important to update the mtime (modification time) of the records so you know which ones to mark as updated in step #4.

## 3. Check your work.

```sql
select * from records where mtime > (now() - interval 5 minute);
select distinct zone from records where mtime > (now() - interval 5 minute);
```

## 4. Mark the zones for these records as having been updated.

This could take several seconds to several minutes, so be patient.
The number of records updated should match the number of rows returned
in the second query for step #3.

```sql
update zones set updated = 1 where id in (
  select distinct zone from records where mtime > (now() - interval 5 minute));
```

## 5. Check your work again.

```sql
select * from zones where updated = 1;
```

At this point you can log in to the ProBIND GUI and see a list of pending changes.
Feel free to click through the pending changes to verify they are correct.
If everything looks good (and it should because you were careful and checked your work as
you went), click the "Push updates" tab then click the "Start Update" button.
Be patient while the new zone files are generated and updated on the nameservers.
When finished, scroll to the bottom and view the logs to verify your changes were successful.
