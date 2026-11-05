
const q=(s,root=document)=>root.querySelector(s);const qa=(s,root=document)=>[...root.querySelectorAll(s)];
let foodCategory='すべて';
function filterFoods(){const term=q('#foodSearch').value.trim().toLowerCase();let visible=0;qa('.food-card').forEach(card=>{const okCategory=foodCategory==='すべて'||card.dataset.category===foodCategory;const okTerm=!term||card.dataset.search.includes(term);const show=okCategory&&okTerm;card.classList.toggle('hidden',!show);if(show)visible++;});q('#foodNoResults').classList.toggle('show',visible===0);q('#foodCount').textContent=visible;}
qa('#foodChips .chip').forEach(button=>button.addEventListener('click',()=>{qa('#foodChips .chip').forEach(x=>x.classList.remove('active'));button.classList.add('active');foodCategory=button.dataset.category;filterFoods();}));q('#foodSearch').addEventListener('input',filterFoods);
let restaurantArea='すべて';
function filterRestaurants(){const grid=q('#restaurantGrid');const sort=q('#restaurantSort').value;let cards=qa('.restaurant-card');cards.sort((a,b)=>sort==='crowd'?Number(a.dataset.crowd)-Number(b.dataset.crowd)||Number(a.dataset.index)-Number(b.dataset.index):Number(a.dataset.index)-Number(b.dataset.index));cards.forEach(card=>{grid.appendChild(card);card.classList.toggle('hidden',restaurantArea!=='すべて'&&card.dataset.area!==restaurantArea);});}
qa('#restaurantChips .chip').forEach(button=>button.addEventListener('click',()=>{qa('#restaurantChips .chip').forEach(x=>x.classList.remove('active'));button.classList.add('active');restaurantArea=button.dataset.area;filterRestaurants();}));q('#restaurantSort').addEventListener('change',filterRestaurants);
filterFoods();filterRestaurants();
