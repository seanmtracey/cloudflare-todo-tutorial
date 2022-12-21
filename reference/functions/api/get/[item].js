export async function onRequest(context) {

	const data = await context.env.TODO.get(context.params.item);
	return new Response(JSON.stringify(data), {
		headers: { 
			'Content-Type': 'application/json'
		},
	});

}