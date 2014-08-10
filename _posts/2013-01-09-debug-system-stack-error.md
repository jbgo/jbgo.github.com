---
layout: post
title: Debug SystemStackError in ruby 1.9
---

This is how I debug SystemStackError when there is no stack trace.

My first attempt was:

```rb
begin
  a_method_that_causes_infinite_recursion_in_a_not_obvious_way
rescue SystemStackError
  puts caller
end
```

But that was a total fail because the stack trace I got was this:

```
(irb):2:in `irb_binding'
/Users/jordan/.rvm/rubies/ruby-1.9.3-p286-perf/lib/ruby/1.9.1/irb/workspace.rb:80:in `eval'
/Users/jordan/.rvm/rubies/ruby-1.9.3-p286-perf/lib/ruby/1.9.1/irb/workspace.rb:80:in `evaluate'
/Users/jordan/.rvm/rubies/ruby-1.9.3-p286-perf/lib/ruby/1.9.1/irb/context.rb:254:in `evaluate'
/Users/jordan/.rvm/rubies/ruby-1.9.3-p286-perf/lib/ruby/1.9.1/irb.rb:159:in `block (2 levels) in eval_input'
/Users/jordan/.rvm/rubies/ruby-1.9.3-p286-perf/lib/ruby/1.9.1/irb.rb:273:in `signal_status'
/Users/jordan/.rvm/rubies/ruby-1.9.3-p286-perf/lib/ruby/1.9.1/irb.rb:156:in `block in eval_input'
/Users/jordan/.rvm/rubies/ruby-1.9.3-p286-perf/lib/ruby/1.9.1/irb/ruby-lex.rb:243:in `block (2 levels) in each_top_level_statement'
/Users/jordan/.rvm/rubies/ruby-1.9.3-p286-perf/lib/ruby/1.9.1/irb/ruby-lex.rb:229:in `loop'
/Users/jordan/.rvm/rubies/ruby-1.9.3-p286-perf/lib/ruby/1.9.1/irb/ruby-lex.rb:229:in `block in each_top_level_statement'
/Users/jordan/.rvm/rubies/ruby-1.9.3-p286-perf/lib/ruby/1.9.1/irb/ruby-lex.rb:228:in `catch'
/Users/jordan/.rvm/rubies/ruby-1.9.3-p286-perf/lib/ruby/1.9.1/irb/ruby-lex.rb:228:in `each_top_level_statement'
/Users/jordan/.rvm/rubies/ruby-1.9.3-p286-perf/lib/ruby/1.9.1/irb.rb:155:in `eval_input'
/Users/jordan/.rvm/rubies/ruby-1.9.3-p286-perf/lib/ruby/1.9.1/irb.rb:70:in `block in start'
/Users/jordan/.rvm/rubies/ruby-1.9.3-p286-perf/lib/ruby/1.9.1/irb.rb:69:in `catch'
/Users/jordan/.rvm/rubies/ruby-1.9.3-p286-perf/lib/ruby/1.9.1/irb.rb:69:in `start'
/Users/jordan/.rvm/gems/ruby-1.9.3-p286-perf/gems/railties-3.1.10/lib/rails/commands/console.rb:45:in `start'
/Users/jordan/.rvm/gems/ruby-1.9.3-p286-perf/gems/railties-3.1.10/lib/rails/commands/console.rb:8:in `start'
/Users/jordan/.rvm/gems/ruby-1.9.3-p286-perf/gems/railties-3.1.10/lib/rails/commands.rb:40:in `<top (required)>'
script/rails:6:in `require'
script/rails:6:in `<main>'
```

Yeah, so nothing useful. I expected to see thousands of method calls! Instead I see no methods beyond the IRB prompt.

No worries, ruby has [tracing functionality built-in](http://ruby-doc.org/core-1.9.3/Kernel.html#method-i-set_trace_func), so I used that instead. Here's the one I wrote. This will spit out a ton of information, so the challenge is filtering so that you only capture useful information. Oh, and, uh... you want to write this to a file because otherwise it will flood your irb prompt.

```rb
$enable_tracing = false
$trace_out = open('trace.txt', 'w')

set_trace_func proc { |event, file, line, id, binding, classname|
  if $enable_tracing && event == 'call'
    $trace_out.puts "#{file}:#{line} #{classname}##{id}"
  end
}

$enable_tracing = true
a_method_that_causes_infinite_recursion_in_a_not_obvious_way
```

Now let's check to see if I have some methods...

```sh
$ ls -lH | grep trace
-rw-r--r--   1 jordan  staff   5.1M Jan  9 09:03 trace.txt
$ wc -l trace.txt 
   37841 trace.txt
```

I sure do! 37841 method calls in fact. I'll leave it to an excercise for the reader to find out what's causing the stack overflow.
