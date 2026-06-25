-- Pengo migration 0003 — remove Laguna Hills (LH) and categorize items
-- Run AFTER 0002. Safe to run more than once.

-- 1. Remove the Laguna Hills location (cascades its stock counts; totals recompute)
delete from public.locations where code = 'LH';

-- 2. Fill in categories for items imported without one
update public.inventory_items set category = 'Dairy' where supplier = 'Restaurant Depot' and name = 'Mocha Mix';
update public.inventory_items set category = 'Dairy' where supplier = 'Restaurant Depot' and name = 'Egg Yolks';
update public.inventory_items set category = 'Produce' where supplier = 'Restaurant Depot' and name = 'Mint';
update public.inventory_items set category = 'Produce' where supplier = 'Restaurant Depot' and name = 'Lime Juice';
update public.inventory_items set category = 'Frozen Fruit' where supplier = 'Restaurant Depot' and name = 'FR Straw Bag';
update public.inventory_items set category = 'Frozen Fruit' where supplier = 'Restaurant Depot' and name = 'FR Mango Bag';
update public.inventory_items set category = 'Frozen Fruit' where supplier = 'Restaurant Depot' and name = 'FR Pineapple';
update public.inventory_items set category = 'Ice Cream' where supplier = 'Restaurant Depot' and name = 'IC Vanilla';
update public.inventory_items set category = 'Sweeteners' where supplier = 'Restaurant Depot' and name = 'White Sugar';
update public.inventory_items set category = 'Sweeteners' where supplier = 'Restaurant Depot' and name = 'Brown Sugar';
update public.inventory_items set category = 'Frozen Food' where supplier = 'Restaurant Depot' and name = 'Garlic Fries';
update public.inventory_items set category = 'Frozen Food' where supplier = 'Restaurant Depot' and name = 'Sweet Potato Fries';
update public.inventory_items set category = 'Frozen Food' where supplier = 'Restaurant Depot' and name = 'Popcorn Chicken';
update public.inventory_items set category = 'Frozen Food' where supplier = 'Restaurant Depot' and name = 'Calamari';
update public.inventory_items set category = 'Sauces' where supplier = 'Restaurant Depot' and name = 'Sweet Chili Sauce';
update public.inventory_items set category = 'Sauces' where supplier = 'Restaurant Depot' and name = 'Buffalo Sauce';
update public.inventory_items set category = 'Sauces' where supplier = 'Restaurant Depot' and name = 'Spicy Mayo';
update public.inventory_items set category = 'Sauces' where supplier = 'Restaurant Depot' and name = 'Korean BBQ Sauce';
update public.inventory_items set category = 'Sauces' where supplier = 'Restaurant Depot' and name = 'Kethchup';
update public.inventory_items set category = 'Sauces' where supplier = 'Restaurant Depot' and name = 'Ranch';

update public.inventory_items set category = 'Toppings' where supplier = 'Lollicup' and name = 'Boba';
update public.inventory_items set category = 'Toppings' where supplier = 'Lollicup' and name = 'Strawberry Popping Boba';
update public.inventory_items set category = 'Toppings' where supplier = 'Lollicup' and name = 'Aloe Vera';
update public.inventory_items set category = 'Toppings' where supplier = 'Lollicup' and name = 'Rainbow Jelly';
update public.inventory_items set category = 'Toppings' where supplier = 'Lollicup' and name = 'Rainbow Popping';
update public.inventory_items set category = 'Toppings' where supplier = 'Lollicup' and name = 'Coffee Jelly';
update public.inventory_items set category = 'Toppings' where supplier = 'Lollicup' and name = 'Lychee Jelly';
update public.inventory_items set category = 'Toppings' where supplier = 'Lollicup' and name = 'Crystal Boba';
update public.inventory_items set category = 'Toppings' where supplier = 'Lollicup' and name = 'Custard Pudding';
update public.inventory_items set category = 'Toppings' where supplier = 'Lollicup' and name = 'Milk Pudding';
update public.inventory_items set category = 'Sweeteners' where supplier = 'Lollicup' and name = 'Dark Brown Sugar';
update public.inventory_items set category = 'Tea' where supplier = 'Lollicup' and name = 'Jasmine Green Tea';
update public.inventory_items set category = 'Tea' where supplier = 'Lollicup' and name = 'Red (Black) Tea';
update public.inventory_items set category = 'Tea' where supplier = 'Lollicup' and name = 'Thai Tea';
update public.inventory_items set category = 'Powders & Mixes' where supplier = 'Lollicup' and name = 'Non-Dairy Creamer';
update public.inventory_items set category = 'Powders & Mixes' where supplier = 'Lollicup' and name = 'Taro Mix';
update public.inventory_items set category = 'Powders & Mixes' where supplier = 'Lollicup' and name = 'Sea Salt Powder';
update public.inventory_items set category = 'Supplies' where supplier = 'Lollicup' and name = 'Disposable Gloves';
update public.inventory_items set category = 'Supplies' where supplier = 'Lollicup' and name = 'Aqua Color Straw';
update public.inventory_items set category = 'Supplies' where supplier = 'Lollicup' and name = 'Small Straw';
update public.inventory_items set category = 'Supplies' where supplier = 'Lollicup' and name = '1-Cup Holder Bags';
update public.inventory_items set category = 'Supplies' where supplier = 'Lollicup' and name = '2-Cup Holder Bags';
update public.inventory_items set category = 'Supplies' where supplier = 'Lollicup' and name = '4-Cup Holder Bags';
update public.inventory_items set category = 'Supplies' where supplier = 'Lollicup' and name = 'Hot Drink Cup';
update public.inventory_items set category = 'Supplies' where supplier = 'Lollicup' and name = 'Hot Drink Lid';
update public.inventory_items set category = 'Supplies' where supplier = 'Lollicup' and name = 'Napkins';
update public.inventory_items set category = 'Supplies' where supplier = 'Lollicup' and name = 'Paper Towel (Fold)';
update public.inventory_items set category = 'Supplies' where supplier = 'Lollicup' and name = 'Paper Towel Roll';

