// Seoul Trip 2027 - offline read-only website shell.
// Bump this version whenever the cached application shell changes.
const CACHE_NAME="seoul-trip-v1";
const SHELL=["./","./index.html","./attractions.html","./calendar-config.js","./apple-touch-icon.png"];
const FIREBASE_MODULES=[
	"https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js",
	"https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js"
];
self.addEventListener("install",event=>{
	event.waitUntil((async()=>{
		const cache=await caches.open(CACHE_NAME);
		await cache.addAll(SHELL);
		await Promise.allSettled(FIREBASE_MODULES.map(url=>cache.add(url)));
		await self.skipWaiting();
	})());
});
self.addEventListener("activate",event=>{
	event.waitUntil((async()=>{
		const keys=await caches.keys();
		await Promise.all(keys.filter(key=>key.startsWith("seoul-trip-")&&key!==CACHE_NAME).map(key=>caches.delete(key)));
		await self.clients.claim();
	})());
});
self.addEventListener("fetch",event=>{
	const request=event.request;
	if(request.method!=="GET")return;
	const url=new URL(request.url);
	if(url.origin===self.location.origin){
		event.respondWith((async()=>{
			const cache=await caches.open(CACHE_NAME);
			const cached=await cache.match(request);
			if(request.mode==="navigate"){
				try{
					const response=await fetch(request);
					if(response.ok)await cache.put(request,response.clone());
					return response;
				}catch{
					return cached||await cache.match("./index.html")||Response.error();
				}
			}
			if(cached)return cached;
			try{
				const response=await fetch(request);
				if(response.ok)await cache.put(request,response.clone());
				return response;
			}catch{return Response.error();}
		})());
		return;
	}
	if(url.origin==="https://www.gstatic.com"&&url.pathname.startsWith("/firebasejs/11.10.0/")){
		event.respondWith((async()=>{
			const cache=await caches.open(CACHE_NAME);
			const cached=await cache.match(request);
			if(cached)return cached;
			try{
				const response=await fetch(request);
				if(response.ok||response.type==="opaque")await cache.put(request,response.clone());
				return response;
			}catch{return Response.error();}
		})());
	}
});
