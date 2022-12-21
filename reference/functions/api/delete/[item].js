export async function onRequest(context) {

    if(context.request.method !== "DELETE"){

        const responseMsg = {
            status : "err",
            msg : `Improper request method "${context.request.method}" used. Request method must be "DELETE"`
        };

        return new Response(JSON.stringify(responseMsg), {
            headers: { 
                'Content-Type': 'application/json'
            },
        });

    } else {
        
        await context.env.TODO.delete(context.params.item);
        
        return new Response(JSON.stringify({status : "ok"}), {
            headers: { 
                'Content-Type': 'application/json'
            },
        });

    }


}