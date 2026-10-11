import { test, expect } from '@playwright/test';
const token = `test.${Buffer.from(JSON.stringify({role:'Manager',exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')}.test`;
test('catalog metadata is locked, comes from API and used models disappear', async ({page}) => {
 await page.addInitScript(token=>sessionStorage.setItem('skyshift.session',JSON.stringify({id:7,name:'Manager',email:'m@example.com',token,gender:'Male'})),token);
 // Exact shape of GET /api/manager/vehicles/catalog.
 const model={id:4,manufacturer:'Bugatti',modelName:'Chiron Super Sport',seats:2,seatsAccuracy:'Illustrative',maxRoadSpeedKmh:440,maxSpeedKmh:440,maxRoadSpeedAccuracy:'Verified',imageUrl:'/catalog/car-04.webp',description:'Hypercar concept.',descriptionHe:'הדמיית ספורט',identification:'Identified'};
 let fleet:any[]=[]; let saved:any; const catalogPaths:string[]=[];
 await page.route('**/api/manager/vehicles/catalog',route=>{catalogPaths.push(new URL(route.request().url()).pathname);return route.fulfill({json:fleet.length?[]:[model]});});
 await page.route('**/api/manager/vehicles',async route=>{
  if(route.request().method()==='POST'){saved=route.request().postDataJSON();
   const {identification,...rest}=model;
   fleet=[{...rest,catalogItemId:4,catalogIdentification:identification,id:72,status:'Available',createdAt:new Date().toISOString()}];await route.fulfill({status:201,json:fleet[0]});}
  else await route.fulfill({json:fleet});
 });
 await page.goto('/manager/vehicles');
 await page.getByRole('button',{name:'Add vehicle',exact:true}).click();
 await expect(page.getByLabel('Model name')).toHaveValue('Chiron Super Sport');
 await expect(page.getByLabel('Manufacturer',{exact:true})).toHaveValue('Bugatti');
 await expect(page.getByLabel('Maximum road speed (km/h)')).toHaveValue('440');
 await expect(page.getByLabel('Number of seats')).toHaveValue('2');
 await expect(page.getByLabel('Manufacturer',{exact:true})).toHaveAttribute('readonly','');
 for(const label of ['Model name','Maximum road speed (km/h)','Number of seats','Vehicle description']) await expect(page.getByLabel(label)).toHaveAttribute('readonly','');
 // Screen readers hear each value together with its accuracy label.
 await expect(page.getByRole('spinbutton',{name:'Maximum road speed (km/h) Manufacturer specification'})).toHaveValue('440');
 await expect(page.getByRole('spinbutton',{name:'Number of seats Illustrative'})).toHaveValue('2');
 // Per-value accuracy labels, the explanation and the propeller note.
 const form=page.locator('form');
 await expect(form.locator('.accuracy-badge.illustrative')).toHaveText(['Illustrative']);
 await expect(form.locator('.accuracy-badge.verified')).toHaveText(['Manufacturer specification']);
 await expect(form.getByText('Illustrative SkyShift data — not a manufacturer specification')).toBeVisible();
 await expect(form.getByText('Propellers are a SkyShift illustration; the road car does not fly')).toBeVisible();
 await expect(form.getByText('Visual inspiration — model not verified')).toHaveCount(0);
 await expect(page.getByText(/simulated flight/i)).toHaveCount(0);
 // The vehicle-type flag has no backend behavior, so the form offers no checkbox for it.
 await expect(form.getByRole('checkbox')).toHaveCount(0);
 await expect(form.getByText('Personal experimental vehicle')).toHaveCount(0);
 // The catalog is requested at the real endpoint, not /api/api/...
 expect(catalogPaths.length).toBeGreaterThan(0);
 expect(new Set(catalogPaths)).toEqual(new Set(['/api/manager/vehicles/catalog']));
 await page.getByRole('button',{name:'Create vehicle',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Bugatti Chiron Super Sport'})).toBeVisible();
 expect(saved).toEqual({catalogItemId:4,isPersonalExperimental:false});
 const card=page.locator('.vehicle-card');
 await expect(card.getByText(/Personal experimental|Shared fleet/)).toHaveCount(0);
 await expect(card.locator('.accuracy-badge.illustrative')).toHaveCount(1);
 await expect(card.locator('.accuracy-badge.verified')).toHaveCount(1);
 await expect(card.getByText('Propellers are a SkyShift illustration; the road car does not fly')).toBeVisible();
 await page.reload();await expect(page.getByRole('heading',{name:'Bugatti Chiron Super Sport'})).toBeVisible();
 await expect(page.locator('.vehicle-art img')).toHaveAttribute('src','/catalog/car-04.webp');
 await page.getByRole('button',{name:'Add vehicle',exact:true}).click();
 await expect(page.getByRole('heading',{name:'All catalog models are already in the fleet'})).toBeVisible();
 await expect(page.getByRole('button',{name:'Create vehicle',exact:true})).toBeDisabled();
});

test('catalog accuracy labels and visual-inspiration note appear in Hebrew', async ({page}) => {
 await page.addInitScript(token=>{sessionStorage.setItem('skyshift.session',JSON.stringify({id:7,name:'Manager',email:'m@example.com',token,gender:'Female'}));localStorage.setItem('skyshift.language','he');},token);
 const model={id:13,manufacturer:'Bestune',modelName:'Xiaoma (uncertain)',seats:4,seatsAccuracy:'Illustrative',maxRoadSpeedKmh:100,maxSpeedKmh:100,maxRoadSpeedAccuracy:'Illustrative',imageUrl:'/catalog/car-13.webp',description:'City car.',descriptionHe:'מכונית עירונית.',identification:'VisualInspiration'};
 await page.route('**/api/manager/vehicles/catalog',route=>route.fulfill({json:[model]}));
 await page.route('**/api/manager/vehicles',route=>route.fulfill({json:[]}));
 await page.goto('/manager/vehicles');
 await page.getByRole('button',{name:'הוספת רכב',exact:true}).click();
 const form=page.locator('form');
 await expect(form.getByLabel('מהירות כביש מרבית (קמ״ש)')).toHaveValue('100');
 await expect(form.locator('.accuracy-badge.illustrative')).toHaveText(['להמחשה','להמחשה']);
 await expect(form.getByText('נתוני המחשה של SkyShift — אינם מפרט יצרן')).toBeVisible();
 await expect(form.getByText('השראה חזותית — הדגם לא אומת')).toBeVisible();
 await expect(form.getByText('המדחפים הם הדמיה של SkyShift; רכב הכביש אינו טס')).toBeVisible();
 await expect(form.getByLabel('תיאור הרכב')).toHaveValue('מכונית עירונית.');
});

test('server gender overrides local preference and survives reload',async({page})=>{
 await page.addInitScript(token=>{localStorage.setItem('skyshift.language','he');localStorage.setItem('skyshift.addressing.7','female');sessionStorage.setItem('skyshift.session',JSON.stringify({id:7,name:'Dan',email:'m@example.com',token,gender:'Male'}));},token.replace(Buffer.from(JSON.stringify({role:'Manager',exp:Math.floor(Date.now()/1000)+3600})).toString('base64url'),Buffer.from(JSON.stringify({role:'User',exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')));
 await page.route('**/api/dashboard',route=>route.fulfill({json:{expectedMonthlyTrips:60,completedFlights:0,percentage:0,isLotteryEligible:false,currentVehicle:null}}));
 await page.route('**/api/vehicles/available',route=>route.fulfill({json:[]}));
 await page.goto('/dashboard');await expect(page.getByRole('heading',{name:/ברוך השב/})).toBeVisible();
 await page.reload();await expect(page.getByRole('heading',{name:/ברוך השב/})).toBeVisible();
});
test('flight conflict uses matching server language and sends UTC',async({page})=>{
 const userToken=`test.${Buffer.from(JSON.stringify({role:'User',exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')}.test`;
 await page.addInitScript(token=>sessionStorage.setItem('skyshift.session',JSON.stringify({id:7,name:'Rivka',email:'r@example.com',token,gender:'Female'})),userToken);
 await page.route('**/api/vehicles/mine',route=>route.fulfill({json:{id:3,status:1,isPersonalExperimental:false,modelName:'SkyShift API'}}));
 let sent:any;let lang:string|undefined;
 await page.route('**/api/flights',route=>{sent=route.request().postDataJSON();lang=route.request().headers()['accept-language'];return route.fulfill({status:409,json:{code:'duplicate_flight',messageHe:'כבר תועדה טיסה במועד הזה.',messageEn:'This flight has already been recorded.'}});});
 await page.goto('/record-flight');await page.getByRole('button',{name:'עברית',exact:true}).click();
 await page.locator('input[name=date]').fill('2026-10-01T12:30');
 await page.locator('form button.full').click();
 await expect(page.getByRole('alert')).toContainText('כבר תועדה טיסה במועד הזה.');expect(lang).toBe('he');expect(sent.date).toMatch(/Z$/);
 await page.getByRole('button',{name:'English',exact:true}).click();await expect(page.getByRole('alert')).toContainText('This flight has already been recorded.');
});

test('participant pages show no vehicle-type filter or badges, even when the API returns the flag', async ({page}) => {
 const userToken=`test.${Buffer.from(JSON.stringify({role:'User',exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')}.test`;
 await page.addInitScript(token=>sessionStorage.setItem('skyshift.session',JSON.stringify({id:7,name:'Rivka',email:'r@example.com',token,gender:'Female'})),userToken);
 const vehicles=[{id:1,status:0,isPersonalExperimental:false,modelName:'Fleet One'},{id:2,status:0,isPersonalExperimental:true,modelName:'Flagged Two'}];
 let assigned=false;
 await page.route('**/api/vehicles/available',route=>route.fulfill({json:assigned?[]:vehicles}));
 await page.route('**/api/vehicles/mine',route=>assigned?route.fulfill({json:{...vehicles[1],status:1}}):route.fulfill({status:204}));
 await page.route('**/api/dashboard',route=>route.fulfill({json:{expectedMonthlyTrips:60,completedFlights:0,percentage:0,isLotteryEligible:false,currentVehicle:assigned?{...vehicles[1],status:1}:null}}));
 const typeText=/Personal experimental|Shared fleet|Vehicle type/;
 await page.goto('/vehicles');
 // Both vehicles are listed regardless of the flag, with no filter and no type badge.
 await expect(page.getByRole('heading',{name:'Fleet One'})).toBeVisible();
 await expect(page.getByRole('heading',{name:'Flagged Two'})).toBeVisible();
 await expect(page.getByRole('combobox')).toHaveCount(0);
 await expect(page.getByText(typeText)).toHaveCount(0);
 assigned=true;
 await page.goto('/my-vehicle');
 await expect(page.getByRole('heading',{name:'Flagged Two'})).toBeVisible();
 await expect(page.getByText(typeText)).toHaveCount(0);
 await page.goto('/dashboard');
 await expect(page.getByRole('heading',{name:'Flagged Two'})).toBeVisible();
 await expect(page.getByText(typeText)).toHaveCount(0);
});
