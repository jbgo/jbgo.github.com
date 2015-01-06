---
layout: post
title: Working with JSON in PostgreSQL
---

A JSON column is a convenient way to store structured data (like a ruby hash or JavaScript object), in your database. For example, you may want to store some metadata from an API call just in case you need it later, but you would rather not waste time creating a database schema to match your API call if you don't need it. But what happens when 6 months from know your boss starts asking for reports based on data you haphazardly shoved in a JSON column? This post will explore some edge cases around PostgreSQL's JSON data type to answer this question.

First we need to create a table in our database.

```
create table sales_reports ( store varchar, report json );
```

We created a table with two columns, one for a store name, and a JSON column to store a sales report.

Now we need some sample data to work with.

```
insert into sales_reports (store, report) values
  ('Gunter Guitars', '{"date": "2013-12-01", "total":"322"}'),
  ('Gunter Guitars', '{"date": "2013-12-02", "total":345}'),
  ('Gunter Guitars', '{"date": "2013-12-03", "total":"367"}'),
  ('Gunter Guitars', '{"date": "2013-12-04", "total":"328"}'),
  ('Gunter Guitars', '{"date": "2013-12-05", "total":414.0}'),
  ('Gunter Guitars', '{"date": "2013-12-06", "total":465}'),
  ('Gunter Guitars', '{"date": "2013-12-07", "total":"288"}');
```

If you look carefully, you will notice that I included some strings disguised as numbers in the total field of the report column. For our purposes, let's assume that Gunter himself enters the sales data and is sloppy with his data entry.

## Conditions

Selling more than $400 worth of merchandise in a single day is a good day for Gunter. He wants to know how many of those

JSON operators:
http://www.postgresql.org/docs/9.3/static/functions-json.html#FUNCTIONS-JSON-OP-TABLE

```
select * from sales_reports where (report->>'total')::numeric > 400;
     store      |                report
----------------+---------------------------------------
 Gunter Guitars | {"date": "2013-12-05", "total":414.0}
 Gunter Guitars | {"date": "2013-12-06", "total":465}
(2 rows)
```

We use the `->>` operator to return the report column's total field as text. Then we need to cast it to the numeric data type so we can check whether or not it's greater than 400. I chose the numeric data type because we have a mix of integer and decimal values, and the `::numeric` handles both. Attempting to cast to `::int` or some other data type would result in an error.

Here is the reference for all of the [PostgreSQL JSON functions and operators](http://www.postgresql.org/docs/9.3/static/functions-json.html).

## Aggregations

Using JSON operators in `where` clause works great, so now let's try them in other parts of the query. For example we could find Gunter's total sales by taking the sum of the `report->>'total'` field.

```
select sum((report->>'total')::numeric) from sales_reports where store = 'Gunter Guitars';
 sum
------
 2529.0
(1 row)
```

The sum works as expected, but there are some edge cases we need to consider. Let's see how PostgreSQL handles the various edge cases we may encounter. We will now add some more rows to produce these edge cases.

__This total is absent from this report.__

```
insert into sales_reports (store, report) values ('Gunter Guitars', '{"date": "2013-12-08"}');
```

__The total is null in this report.__

```
insert into sales_reports (store, report) values ('Gunter Guitars', '{"date": "2013-12-09", "total":null}');
```

__The total is a non-numeric string in this report.___

```
insert into sales_reports (store, report) values ('Gunter Guitars', '{"date": "2013-12-10", "total":"n/a"}');
```

```
sales_data=# select * from sales_reports where (report->>'total')::numeric > 400;
ERROR:  invalid input syntax for type numeric: "n/a"
```

It looks like we can't handle

sales_data=# delete from sales_reports where report->>'total' = 'n/a';
DELETE 1


sales_data=# select * from sales_reports where (report->>'total')::numeric > 400;
     store      |                report
----------------+---------------------------------------
 Gunter Guitars | {"date": "2013-12-05", "total":414.0}
 Gunter Guitars | {"date": "2013-12-06", "total":465}
(2 rows)
```

So we can handle null or missing values, but not types that can't be coerced to numeric. That's good to
know. It means we must ensure validation is performed on the client application, or we should avoid
doing aggregations on JSON fields.

Works for aggregations, too!

sales_data=# select sum((report->>'total')::numeric) from sales_reports where store = 'Gunter Guitars';
  sum
--------
 2529.0
(1 row)

Now to create an index...

First we need a bunch of test data

sales_data=# insert into sales_reports
sales_data-# select 'Gunter Guitars', ('{"total": "' || (random() * 1000) || '"}')::json from
sales_data-# (select * from generate_series(1,100000)) as tmp;
INSERT 0 100000

sales_data=# explain analyze select * from sales_reports where (report->>'total')::numeric::int > 900;
                                                     QUERY PLAN
---------------------------------------------------------------------------------------------------------------------
 Seq Scan on sales_reports  (cost=0.00..3185.20 rows=33336 width=47) (actual time=0.075..215.063 rows=10018 loops=1)
   Filter: ((((report ->> 'total'::text))::numeric)::integer > 900)
   Rows Removed by Filter: 89991
 Total runtime: 215.982 ms
(4 rows)

sales_data=# create index int_sales_total_idx on sales_reports (cast(report->>'total' as numeric));
CREATE INDEX




sales_data=# explain analyze select * from sales_reports where (report->>'total')::numeric > 900;
                                                              QUERY PLAN
--------------------------------------------------------------------------------------------------------------------------------------
 Bitmap Heap Scan on sales_reports  (cost=778.78..2380.50 rows=33336 width=47) (actual time=3.643..6.678 rows=10069 loops=1)
   Recheck Cond: (((report ->> 'total'::text))::numeric > 900::numeric)
   ->  Bitmap Index Scan on int_sales_total_idx  (cost=0.00..770.45 rows=33336 width=0) (actual time=3.457..3.457 rows=10069 loops=1)
         Index Cond: (((report ->> 'total'::text))::numeric > 900::numeric)
 Total runtime: 7.159 ms
(5 rows)

That's over a 100x improvement! Definitely worth doing.


What if we wanted to get crazy and join with some other table?
Not that we would ever do this for real, but we could...

sales_data=# create table categories (id int, value float);
CREATE TABLE

sales_data-# select (random() * 1000)::int, random() from
sales_data-# (select * from generate_series(1,100)) as tmp;
INSERT 0 100

Well, we can't just join on any column type...

sales_data=# select * from categories
sales_data-# inner join sales_reports on sales_reports.report->>'total' = categories.id
sales_data-# where categories.id = (select id from categories limit 1 offset 50);
ERROR:  operator does not exist: text = integer
LINE 2: ...n sales_reports on sales_reports.report->>'total' = categori...
                                                             ^
HINT:  No operator matches the given name and argument type(s). You might need to add explicit type casts.

But we can use a type cast again! This time we have to cast to int. Note that we can't just cast directly
to int because some numbers are decimal numbers. Also, notice that the type cast rounds the numbers. You
would also want to create an index on this expression if you really were doing such a thing.

sales_data=# select * from categories
sales_data-# inner join sales_reports on (sales_reports.report->>'total')::numeric::int = categories.id
sales_data-# where categories.id = (select id from categories limit 1 offset 50);
 id  |       value       |     store      |            report
-----+-------------------+----------------+-------------------------------
 209 | 0.560386191587895 | Gunter Guitars | {"total": "208.587245084345"}
 209 | 0.560386191587895 | Gunter Guitars | {"total": "209.356032311916"}
 209 | 0.560386191587895 | Gunter Guitars | {"total": "208.742826711386"}
 209 | 0.560386191587895 | Gunter Guitars | {"total": "209.115498699248"}
 209 | 0.560386191587895 | Gunter Guitars | {"total": "209.328144323081"}
 ... 91 more rows ...
(96 rows)



Now what happens if we use nested keys?

delete from sales_reports;
insert into sales_reports (store, report) values ('Gunter Guitars', '{"report": {"total": 414}}');
insert into sales_reports (store, report) values ('Gunter Guitars', '{"report": {"total": "414"}}');
insert into sales_reports (store, report) values ('Gunter Guitars', '{"report": {"total": "n/a"}}');
insert into sales_reports (store, report) values ('Gunter Guitars', '{"report": {"total": 414.0}}');
insert into sales_reports (store, report) values ('Gunter Guitars', '{"report": {"total": null}}');
insert into sales_reports (store, report) values ('Gunter Guitars', '{"report": {}}');
insert into sales_reports (store, report) values ('Gunter Guitars', '{"report": null}');
insert into sales_reports (store, report) values ('Gunter Guitars', '{}');
insert into sales_reports (store, report) values ('Gunter Guitars', null);
select sum(((report->'report')->>'total')::numeric) from sales_reports where store = 'Gunter Guitars';
