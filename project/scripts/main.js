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

        // CODE BLOCK 2

        // Update an item in the list
        // using the /api/update endpoint

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

            // CODE BLOCK 3

            // Delete an item from 
            // the KV data store using
            // the /api/delete endpoint

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

    // CODE BLOCK 1

    // Make request to /api/list to get 
    // existing items in KV data store
    // for display, then retrive each item
    // from KV using /api/get


}());