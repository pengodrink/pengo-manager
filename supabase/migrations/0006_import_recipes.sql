-- Pengo migration 0006 — import Laguna Hills drink recipes
delete from public.recipe_ingredients where recipe_id in (select id from public.recipes where category in ('MilkShakes','Smoothie','Coffee and Lattes','Fruit Tea','Orange Series'));
delete from public.recipes where category in ('MilkShakes','Smoothie','Coffee and Lattes','Fruit Tea','Orange Series');
insert into public.recipes (name, category, instructions) values ('Cookie & Cream','MilkShakes','SMALL
200ml Milk
4 Oreo Cookie
Half pump of Hershey Chocolate
1 Pump of Sugar
1 Big scoop of Vanilla Ice Cream
1 Over-the-top Brown scoop of Ice

LARGE
250ml Milk
4 Oreo Cookie
Half pump of Hershey Chocolate
1 Pump of Sugar
1 Big scoop of Vanilla Ice Cream
1 Over-the-top Brown scoop of Ice');
insert into public.recipes (name, category, instructions) values ('Chocolate','MilkShakes','SMALL
200ml Milk
1 Big shot of Hershey Chocolate
1 Pump of Sugar
2 Big scoops of Chocolate Ice Cream
1 Over-the-top Brown scoop of Ice

LARGE
250ml Milk
1 Big shot of Hershey Chocolate
1 Pump of Sugar
2 Big scoops of Chocolate Ice Cream
1 Over-the-top Brown scoop of Ice');
insert into public.recipes (name, category, instructions) values ('Strawberry','MilkShakes','SMALL
200ml Milk
4 Frozen Strawberry
1 Round of Hershey Strawberry
2 Big scoops of Strawberry Ice Cream
1 Pump of Sugar
1 Over-the-top Brown scoop of Ice

LARGE
250ml Milk
4 Frozen Strawberry
1 Round of Hershey Strawberry
2 Big scoops of Strawberry Ice Cream
1 Pump of Sugar
1 Over-the-top Brown scoop of Ice');
insert into public.recipes (name, category, instructions) values ('Matcha','MilkShakes','SMALL
200ml Milk
2 scoop of Matcha
1 scoop of Condensed Milk
1 Big scoop of Vanilla Ice Cream
1 Pump of Sugar
1 Over-The-Top Brown scoop of Ice

LARGE
250ml Milk
2 scoop of Matcha
1 scoop of Condensed Milk
1 Big scoop of Vanilla Ice Cream
1 Pump of Sugar
1 Over-The-Top Brown scoop of Ice');
insert into public.recipes (name, category, instructions) values ('Blended Milk Tea','MilkShakes','300ml Milk Tea
1 Big scoop of Vanilla Ice Cream
1 Over-the-top Brown Scoop of Ice');
insert into public.recipes (name, category, instructions) values ('Signature Honey Boba Milk','MilkShakes','SMALL
250ml Mixed Milk
1 Over-The-Top Brown Scoop of Ice
Brown Sugar mix all around the cup
1 scoop of Boba

LARGE
300ml Mixed Milk
1 Over-The-Top Brown Scoop of Ice
Brown Sugar mix all around the cup
1 scoop of Boba');
insert into public.recipes (name, category, instructions) values ('Vanilla Protein Milkshake','MilkShakes','SMALL
200ml Milk
1 scoop of Vanilla Protein Powder
1 Date (extract the seed)
1 Over-The-Top Brown scoop of Ice
**Blend for at least 30s**

LARGE
250ml Milk
1 scoop of Vanilla Protein Powder
1 Date (extract the seed)
1 Over-The-Top Brown scoop of Ice
**Blend for at least 30s**');
insert into public.recipes (name, category, instructions) values ('Strawberry Protein Milkshake','MilkShakes','200ml Milk
1 scoop of Vanilla Protein Powder
3 Strawberries
½ Small shot of Strawberry Hershey
1 Date
1 Over-The-Top Brown scoop of Ice
**Blend for at least 30s**');
insert into public.recipes (name, category, instructions) values ('Chocolate Protein Milkshake','MilkShakes','SMALL
200ml Milk
1 scoop of Protein Powder
1 pump Hershey Chocolate
1 Date (extract the seed)
1 Over-The-Top Brown scoop of Ice
**Blend for at least 30s**

LARGE
250ml Milk
1 scoop of Protein Powder
1 pump Hershey Chocolate
1 Date (extract the seed)
1 Over-The-Top Brown scoop of Ice
**Blend for at least 30s**');
insert into public.recipes (name, category, instructions) values ('Strawberry Banana','Smoothie','SMALL
250ml Apple Juice
1 bag of Frozen Strawberries (4 oz)
1 bag Banana (2oz)
1 spoon of Greek Yogurt
1 spoon of Condensed Milk
1 Flat Brown scoop of Ice

LARGE
200ml Apple Juice
1 bag of Frozen Strawberries (4 oz)
1 bag Banana (2oz)
1 spoon of Greek Yogurt
1 spoon of Condensed Milk
1 Over Brown scoop of Ice');
insert into public.recipes (name, category, instructions) values ('Mango Tango','Smoothie','SMALL
250ml Apple Juice
1 bag of Frozen Mango (5 oz)
1 spoon of Greek Yogurt
1 spoon of Condensed Milk
1 Flat Brown scoop of Ice

LARGE
300ml Apple Juice
1 bag of Frozen Mango (5 oz)
1 spoon of Greek Yogurt
1 spoon of Condensed Milk
1 Over Brown scoop of Ice');
insert into public.recipes (name, category, instructions) values ('Tropical Twister','Smoothie','SMALL
250ml Apple Juice
1 bag of Frozen Tropical Fruit (5 oz)
1 spoon of Greek Yogurt
1 spoon of Condensed Milk
1 Flat Brown scoop of Ice

LARGE
200ml Apple Juice
1 bag of Frozen Tropical Fruit (5 oz)
1 spoon of Greek Yogurt
1 spoon of Condensed Milk
1 Over Brown scoop of Ice');
insert into public.recipes (name, category, instructions) values ('Mangonada','Smoothie','SMALL
250ml Mango Juice
1 bag of Frozen Mango (5 oz)
1 Big shot of Mango Monin
1 Small shot of Lime
1 Flat Brown scoop of Ice
1 Big shot of Chamoy
Tajin

LARGE
300ml Mango Juice
1 bag of Frozen Mango (5 oz)
1 Big shot of Mango Monin
1 Small shot of Lime
1 Over Brown scoop of Ice
1 Big shot of Chamoy
Tajin');
insert into public.recipes (name, category, instructions) values ('Avocado Creamy','Smoothie','SMALL
250ml Milk
1 full of a small avocado
3 scoops of condensed milk
1 Over-The-Top scoop of ice

LARGE
300ml Milk
1 full & 1/2 of a small avocado
3 scoops of condensed milk
1 Over-The-Top scoop of ice');
insert into public.recipes (name, category, instructions) values ('Avocado Smash','Smoothie','250ml Milk
1 full of a small avocado
3 scoops of condensed milk
1 Over-The-Top scoop of ice');
insert into public.recipes (name, category, instructions) values ('Watermelon Cooler','Smoothie','4 chunks of Watermelon
1 Big shot of Sugar
1 Over-The-Top Brown Scoop of Ice
(Blend the ice with watermelon with slushie)');
insert into public.recipes (name, category, instructions) values ('House Special Coffee','Coffee and Lattes','100ml of Coffee
2 scoops of Condensed Milk
200ml with mixed milk
Fill up ice to half cup
Sea salt cream');
insert into public.recipes (name, category, instructions) values ('Matcha Latte','Coffee and Lattes','1 scoop of Matcha + 50ml of Hot Water
250ml milk
1 Big shot of Sugar (in Milk)
Fill up ice up to half a bottle');
insert into public.recipes (name, category, instructions) values ('Coffee Latte','Coffee and Lattes','1 shot of Coffee
250ml Milk
1 Big shot of Sugar (in Milk)
Fill up Ice up to half a bottle');
insert into public.recipes (name, category, instructions) values ('Oolong Fruit Tea','Fruit Tea','2 chunks of fruit
1 Big shot + 1 Small Shot of Sugar
1 Big shot of Condensed Juice
350 ml Oolong Tea
1 Scoop of Fruit Bits');
insert into public.recipes (name, category, instructions) values ('Heaven Bliss Tea','Fruit Tea','2 Big shots of Sugar
1 scoop of Passion Fruit
300ml of Oolong Tea
1 Flat Brown Scoop of Ice
Add fruits Slices in cup and Pour the drink in');
insert into public.recipes (name, category, instructions) values ('Orange Sunshine','Orange Series','400ml of Orange Juice
1 Big shot of Sugar (optional: depends on the orange juice)
1 Flat Brown Scoop of Ice
1 Slice of Orange in the cup');
insert into public.recipes (name, category, instructions) values ('Jasmine Sunshine','Orange Series','250ml Jasmine Green Tea
150ml Orange Juice
1 Big Shot + 1 Small Shot of Sugar
1 Flat Brown scoop of Ice
1 Slice of Orange in the cup');
insert into public.recipes (name, category, instructions) values ('Matcha Sunshine','Orange Series','300ml Orange Juice
1 Big shot + 1 Small Shot of Sugar
1 Flat Brown scoop of Ice
1 Slice of Orange in the cup
1 Spoon of Matcha + 50ml hot water
Pour orange juice in the cup first then Matcha');
