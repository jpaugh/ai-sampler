An itch demo for Arcane Sword Maker

# Intro

> Craft the weapon with the longest, most legendary name in history!

Start as an enchanter, and buy weapons from the blacksmith, then apply enchantments to try to increase the weapon's value — and name length.

Every enchanter dreams of adding a legendary enchantment to a platinum great sword; but right now, all you can afford to buy is a tin axe!

Eventually, the player can buy a blacksmith's shop, and learn how to craft his own weapons; and, choose the materials used to increase the chances of a longer name.

# Overview

We use a table of Markov chains to store the chance of a given name
part, and we weight the chances based on the material a weapon is made
from, and its construction quality.

The game is an incremental RPG. The UI is a simple react app.
