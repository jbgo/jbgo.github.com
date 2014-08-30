---
layout: post
title: Comparing ruby and go
---

Recently I started learning the [Go language](http://golang.org/). Go is an interesting language for me because it fills the gap nicely between a language that is pleasant to program in, like Ruby, and a language that performs well, like C. When learning a new language, I like to learn how to perform common tasks and see working code before diving into the language in depth.

Today I will compare a simple program in both Ruby in Go. The Ruby program features the use of classes, arrays, hashes, and strings in a way that is idiomatic for ruby. This means we will need to find and use similar features in Go, which will be the discussion of this post.

The program simply takes an array of mammals and groups them by the kind of animal (primate, carnivore, etc.). It then prints out the mammals in each group. This gist contains the [full source code in both languages](https://gist.github.com/jbgo/7790262).

## Go does not have classes

In Ruby, I declared a `Mammal` class, but I can't directly port this to Go because go doesn't have classes. Instead, I created a Mammal type from a struct. You can define functions that work on particular types in go, which gives you methods and class-like behavior.

The Mammal class (ruby):

```
class Mammal
  attr_accessor :name, :group

  def initialize(name, group)
    self.name = name
    self.group = group
  end
end
</code></pre>

<p>The Mammal type (go):</p>

<pre><code>
type Mammal struct {
	name  string
	group string
}
```

## Arrays and slices

Ruby and Go both have arrays, but arrays in go are fixed-size. Go adds slices to the language which are more like ruby arrays, but not entirely.

Array literals (ruby):

```
mammals = [
  Mammal.new('Baboon', 'Primates'),
  Mammal.new('Dingo', 'Carnivora'),
  ...
]
```

Slice and struct literals (go):

```
var mammals = []Mammal{
	Mammal{"Baboon", "Primates"},
	Mammal{"Dingo", "Carnivora"},
  ...
}
```

## Hashes and maps

Ruby has Hashes, go has maps. The only significant difference between them (besides function names and syntax) is that go's maps are statically typed. With ruby you can mix types for hash keys and values, in Go you must declare the key type and the value type for a particular map.

Declaring a hash of arrays in ruby:

```
grouped_mammals = {}
```

Declaring a map of slices in Go:

```
groupedMammals := make(map[string][]string)
```

## Looping and grouping

Now we get to the fun part of this program - looping through the array of mammals and grouping. We want to build a map (hash in ruby) where the keys are the mammal group names, and the values are slices (or arrays in ruby) containing the names of each mammal in that group.

There are several intersting parts to this code, so let's go line-by-line.

Looping (enumerating) in ruby:

```
mammals.each do |mammal|
  ... do stuff
end
```

Looping in go:

```
for index, mammal in range mammals {
  ... do stuff
}
```

Notice the need for the range keyword.

One thing that's nice about ruby is the `||=` operator makes it trivial to assign a default value to a variable if one is not already present. In Go, this takes a few extra steps.

Adding an empty array to a hash if no array exists for that key (ruby):

```
grouped_mammals[mammal.group] ||= []
```

Adding an empty slice to a map in go if no slice exists for that key (go):

```
_, ok := groupedMammals[mammal.group]
if !ok {
  groupedMammals[mammal.group] = make([]string, 0)
}
```

Appending an element to an array (ruby):

```
grouped_mammals[mammal.group] << mammal.name
```

Appending an element to a slice (go):

```
groupedMammals[mammal.group] = append(groupedMammals[mammal.group], mammal.name)
```

## Printing the results

Looping over a hash (ruby):

```
grouped_mammals.each do |group, mammal_names|
  ... do stuff
end
```

Looping over a map (go):

```
for group, animalNames := range groupedMammals {
  ...
}
```

Notice the use of the range keyword in the loop again.

Printing a formatted string (ruby):

```
puts "#{group}: #{mammal_names.join(', ')}"
```

Printing a formatted string (go):

```
fmt.Printf("%s: %s\n", group, strings.Join(animalNames, ", "))
```

In Go, you can't just call methods on any type, oh well.

## Summary

As you can see, the ruby program was pretty easy to translate to a go program. The go program is slightly longer, but the boilerplate is minimal and mostly comes in the form of type declarations. I still prefer the compact nature of ruby, but I could get used to go.
