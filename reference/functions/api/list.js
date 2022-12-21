export async function onRequest(context) {

    const items = await context.env.TODO.list();

	const body = JSON.stringify(items.keys);

	return new Response(body, {
		headers: { 
            'Content-Type': 'application/json'
		},
	});

}