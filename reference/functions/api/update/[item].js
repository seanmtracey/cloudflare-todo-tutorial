
export async function onRequest(context) {

    const itemToUpdate = context.params.item;

	const data = await context.request.json();

    if(!data){

        const responseMsg = {
            status : "err",
            msg : "No data was passed for updating"
        };

        return Response(JSON.stringify(responseMsg), {}, 422);

    }

    try {
        
        await context.env.TODO.put(itemToUpdate, JSON.stringify(data));
        
    } catch(err) {
        
        const responseMsg = {
            status : "err", 
            msg : `Could not update item "${itemToUpdate}"`
        };

        return new Response(JSON.stringify(responseMsg), {
            headers: { 
                'Content-Type': 'application/json'
            },
        }, 500);

    }
    
    return new Response(JSON.stringify({status : "ok"}), {
        headers: { 
            'Content-Type': 'application/json'
        },
    });

}