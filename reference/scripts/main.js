(function(){

    'use strict';

    const newItemBtn = document.querySelector('#newItemBtn');
    const list = document.querySelector('section#list ul');
    const listItemTemplate = document.querySelector('#listItemTemplate');

    const infoSection = document.querySelector('section#info');
    const totalItemsOutput = infoSection.querySelector('#totalItems');
    const crossedOffOutput = infoSection.querySelector('#crossedOff');

    function generateId(sections = 4){

        const characterSet = "abcdefghjkmnpqrstuvwxyz23456789";

        let id = "";

        for(let x = 0; x < sections; x += 1){

            for(let y = 0; y < 3; y += 1){
                id += characterSet[Math.random() * characterSet.length | 0];
            }

            if(x !== sections - 1){
                id += "-";
            }


        }

        return `${Date.now()}::${id}`;

    }

    function evaluateList(){

        let crossedOff = 0;

        const listItems = list.querySelectorAll('li');

        Array.from(listItems).forEach(li => {
            if(li.dataset.status === "checked"){
                crossedOff += 1;
            }
        });

        totalItemsOutput.querySelector('span').textContent = listItems.length;
        crossedOffOutput.querySelector('span').textContent = crossedOff;

    }

    function updateListItem(node){

        console.log("Updating:", node);

        console.log(`id: ${node.dataset.id} status: ${node.dataset.status} value: ${node.querySelector('input').value}`);

        const data = {
            status : node.dataset.status,
            value : node.querySelector('input').value
        };

        return fetch(`/api/update/${node.dataset.id}`, {
                method : "POST",
                body : JSON.stringify(data),
                headers : {
                    "Content-Type" : "application/json"
                }
            })
            .then(res => {
                if(res.ok){
                    return res.json();
                } else {
                    throw res;
                }
            })
            .then(function(){
                evaluateList();
            })
            .catch(err => {
                console.log('PUT err:', err);
            })
        ;

    }

    function createListItem(id, value = "", status = "unchecked"){
        
        const nodes = document.importNode(listItemTemplate.content, true);

        const li = nodes.querySelector('li');
        const checkBox = nodes.querySelector('.checkbox');
        const input = nodes.querySelector('input[type="text"]');
        const deleteBtn = nodes.querySelector('.deleteIcon');

        checkBox.addEventListener('click', function(e){
            
            e.preventDefault();
            e.stopImmediatePropagation();

            const parentElement = this.parentNode;

            if(parentElement.dataset.status === "unchecked"){
                parentElement.dataset.status = "checked";
            } else {
                parentElement.dataset.status = "unchecked";
            }

        }, false);

        input.addEventListener('keyup', function(){

            clearTimeout(this.debounce);

            this.debounce = setTimeout(() => {
                updateListItem(this.parentElement);
            }, 400);

        }, false);

        deleteBtn.addEventListener('click', function(){

            const parentElement = this.parentNode;

            console.log(`Deleting ${parentElement.dataset.id}`);

            fetch(`/api/delete/${parentElement.dataset.id}`, {
                    method : "DELETE"
                })
                .then(res => {
                    if(res.ok){
                        return res.json();
                    } else {
                        throw res;
                    }
                })
                .then(() => {
                    
                    parentElement.parentNode.removeChild(parentElement);
                    evaluateList();

                })
                .catch(err => {
                    console.log('Delete err:', err);
                })
            ;

        }, false);

        input.value = value;

        li.dataset.id = id || generateId();
        li.dataset.status = status;

        return nodes;

    }

    newItemBtn.addEventListener('click', function(e){
        e.preventDefault();
        e.stopImmediatePropagation();

        const newItemElement = createListItem();
        const input = newItemElement.querySelector('input');

        list.appendChild(newItemElement);
        input.focus();

        evaluateList();

    }, false);

    const observer = new MutationObserver(function(mutationList) {
    
        for (const mutation of mutationList) {

            if(mutation.target.nodeName === "LI"){
                updateListItem(mutation.target);
            }

        }

        evaluateList();

    });

    observer.observe(list, { attributes: true, childList: true, subtree: true });

    fetch('/api/list')
        .then(res => {

            if(res.ok){
                return res.json();
            } else {
                throw res;
            }
        
        })
        .then(results => {

            console.log(results);

            const data = results.map(key => {

                console.log(key);

                return fetch(`/api/get/${key.name}`)
                    .then(res => {
                        if(res.ok){
                            return res.json();
                        } else {
                            throw res;
                        }
                    })
                    .then(data => {

                        data = JSON.parse(data);

                        if(data === null){
                            return null;
                        }

                        return {
                            id : key.name,
                            value : data.value,
                            status : data.status
                        };
                    })
                    .catch(err => {
                        console.log(err);
                    })
                ;

            });

            return Promise.all(data);

        })
        .then(data => {
            console.log(data);

            const listItems = data.filter(item => {
                return item !== null;
            }).forEach(item => {
                console.log(item);
                list.appendChild(createListItem(item.id, item.value, item.status));
            });

            console.log(listItems);
            
            list.querySelector('li:last-of-type').scrollIntoView();

        })
        .catch(err => {
            console.log("Initial load err:", err);
        })
    ;

}());