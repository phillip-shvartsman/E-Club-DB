//eslint settings for jquery and Mustache.js
/*eslint-env jquery*/
/*global Mustache*/
/*global getFormData*/
/*global successFlash*/
/*global errorFlash*/
/*global createTimeout*/
/*global closeAllContainers*/
/*global searchParts*/

function buildCheckOutMustachObject(data){
    const users = data.users;
    const checkOuts = data.detailedCheckOut;
    console.log(checkOuts.length);
    const mustacheObject = {unapproved:[],approved:[],out:[],returned:[],hasApproved:false,hasUnapproved:false,hasOut:false,hasReturned:false};
    //Loop through each checkOut entry
    for(let i=0;i<checkOuts.length;i=i+1){
        const checkOut = checkOuts[i];
        let added = false;
        //Depending on the type add it to the different arrays.
        switch(checkOut.type){

        case 'approved':
            //Check to see if there exists an entry for the parts based on user
            mustacheObject.hasApproved = true;
            for(let j=0;j<mustacheObject.approved.length;j=j+1){
                if(mustacheObject.approved[j].userID===checkOut.userID){
                    mustacheObject.approved[j].parts.push(checkOut);
                    added = true;
                }
            }
            //If not already added add a new entry.
            if(added === false){
                mustacheObject.approved.push({parts:[checkOut],userID:checkOut.userID});
            }
            break;
        case 'unapproved':
            mustacheObject.hasUnapproved = true;
            for(let j=0;j<mustacheObject.unapproved.length;j=j+1){
                if(mustacheObject.unapproved[j].userID===checkOut.userID){
                    mustacheObject.unapproved[j].parts.push(checkOut);
                    added = true;
                }
            }
            if(added === false){
                mustacheObject.unapproved.push({parts:[checkOut],userID:checkOut.userID});
            }
            break;
        case 'out':
            mustacheObject.hasOut = true;
            for(let j=0;j<mustacheObject.out.length;j=j+1){
                if(mustacheObject.out[j].userID===checkOut.userID){
                    mustacheObject.out[j].parts.push(checkOut);
                    added = true;
                }
            }
            if(added === false){
                mustacheObject.out.push({parts:[checkOut],userID:checkOut.userID});
            }
            break;
        case 'returned':
            mustacheObject.hasReturned = true;
            for(let j=0;j<mustacheObject.returned.length;j=j+1){
                if(mustacheObject.returned[j].userID===checkOut.userID){
                    mustacheObject.returned[j].parts.push(checkOut);
                    added = true;
                }
            }
            if(added === false){
                mustacheObject.returned.push({parts:[checkOut],userID:checkOut.userID});
            }    
        }
    }
    for(let i=0;i<mustacheObject.approved.length;i=i+1){
        const entry = mustacheObject.approved[i];
        for(let j=0;j<users.length;j=j+1){
            const user = users[j];
            if(entry.userID===user._id){
                mustacheObject.approved[i].email = user.email;
                mustacheObject.approved[i].fName = user.fName;
                mustacheObject.approved[i].lName = user.lName;
                mustacheObject.approved[i].dNum = user.dNum;
            }
        }
    }
    for(let i=0;i<mustacheObject.unapproved.length;i=i+1){
        const entry = mustacheObject.unapproved[i];
        for(let j=0;j<users.length;j=j+1){
            const user = users[j];
            if(entry.userID===user._id){
                mustacheObject.unapproved[i].email = user.email;
                mustacheObject.unapproved[i].fName = user.fName;
                mustacheObject.unapproved[i].lName = user.lName;
                mustacheObject.unapproved[i].dNum = user.dNum;
            }
        }
    }
    for(let i=0;i<mustacheObject.out.length;i=i+1){
        const entry = mustacheObject.out[i];
        for(let j=0;j<users.length;j=j+1){
            const user = users[j];
            if(entry.userID===user._id){
                mustacheObject.out[i].email = user.email;
                mustacheObject.out[i].fName = user.fName;
                mustacheObject.out[i].lName = user.lName;
                mustacheObject.out[i].dNum = user.dNum;
            }
        }
    }
    for(let i=0;i<mustacheObject.returned.length;i=i+1){
        const entry = mustacheObject.returned[i];
        for(let j=0;j<users.length;j=j+1){
            const user = users[j];
            if(entry.userID===user._id){
                mustacheObject.returned[i].email = user.email;
                mustacheObject.returned[i].fName = user.fName;
                mustacheObject.returned[i].lName = user.lName;
                mustacheObject.returned[i].dNum = user.dNum;
            }
        }
    }
    return mustacheObject;
}
function refreshCheckOutTable(mustacheObject){
    const template = $('#admin-check-out-table-template').html();
    const html = Mustache.render(template,mustacheObject);
    $('#check-outs-container').html(html);
    filterCheckOutResults();
}
async function deleteUnapproved(){
    const partID = $('#store-unapproved').attr('partID');
    const userID = $('#store-unapproved').attr('userID');
    const checkOutID = $('#store-unapproved').attr('checkoutID');
    try {
        await $.ajax({
            method:'POST',
            url:'/checkouts/delete-unapproved',
            data:{partID:partID,userID:userID,checkOutID:checkOutID}
        });
        await updateCheckOuts();
        successFlash('Unapproved checkout deleted');
        return;
    }catch(err){
        console.error(err);
        errorFlash('Could not delete checkout.');
    }  
}
async function approvePart(partID,userID,checkOutID){
    try {
        await $.ajax({
            method:'POST',
            url:'/checkouts/approve-part',
            data:{partID:partID,userID:userID,checkOutID:checkOutID}
        });
        await updateCheckOuts();
        successFlash('Part Approved.');
        return;
    }catch(err){
        console.error(err);
        errorFlash('Could not approve part.');
    }
}
async function setPartOut(partID,userID,checkOutID){
    try {
        await $.ajax({
            method:'POST',
            url:'/checkouts/set-part-out',
            data:{partID:partID,userID:userID,checkOutID:checkOutID}
        });
        await updateCheckOuts();
        successFlash('Part has been set as out.');
        return;
    }catch(err){
        console.error(err);
        errorFlash('Could not set part as out.');
    }
}

async function unapprovePart(partID,userID,checkOutID){
    try {
        await $.ajax({
            method:'POST',
            url:'/checkouts/unapprove-part',
            data:{partID:partID,userID:userID,checkOutID:checkOutID  }
        });
        await updateCheckOuts();
        successFlash('Part has been unapproved.');
        return;
    }catch(err){
        console.error(err);
        errorFlash('Could not unapprove part.');
    }
}
async function checkPartIn(checkOutID){
    try {
        await $.ajax({
            method:'POST',
            url:'/checkouts/check-part-in',
            data:{checkOutID:checkOutID  }
        });
        await updateCheckOuts();
        successFlash('Part has been checked in.');
        return;
    }catch(err){
        console.error(err);
        errorFlash('Could not check the part in.');
    }  
}

function addClickEventsCheckOutTable(){
    $('.delete-unapproved').on('click',function(){
        const partID = $(this).attr('partid');
        const userID = $(this).attr('userid');
        const checkOutID = $(this).attr('_id');
        $('#store-unapproved').attr('partID',partID);
        $('#store-unapproved').attr('userID',userID);
        $('#store-unapproved').attr('checkoutID',checkOutID);
        $.confirm({
            title: 'Confirmation',
            content: 'Confirm delete a users unapproved check out?',
            buttons: {
                confirm: function () {
                    deleteUnapproved();
                },
                cancel: function () {
                },
            }
        });
    });
    $('.display-check-out').on('click',function(){
        $(this).siblings('.table').toggle();
    });
    $('.approve-part').on('click',function(){
        const partID = $(this).attr('partid');
        const userID = $(this).attr('userid');
        const checkOutID = $(this).attr('_id');
        approvePart(partID,userID,checkOutID);
    });
    $('.unapprove-part').on('click',function(){
        const partID = $(this).attr('partid');
        const userID = $(this).attr('userid');
        const checkOutID = $(this).attr('_id');
        unapprovePart(partID,userID,checkOutID);
    });
    $('.set-part-out').on('click',function(){
        const partID = $(this).attr('partid');
        const userID = $(this).attr('userid');
        const checkOutID = $(this).attr('_id');
        setPartOut(partID,userID,checkOutID);
    });
    $('.check-in-part').on('click',function(){
        const checkOutID = $(this).attr('_id');
        checkPartIn(checkOutID);
    });
}

async function updateCheckOuts(){
    try{
        const data = await $.ajax({
            method: 'POST',
            url: '/checkouts/get-check-outs'
        });
        //console.log(data);
        const mustacheObject = buildCheckOutMustachObject(data);
        refreshCheckOutTable(mustacheObject);
        addClickEventsCheckOutTable();
    }catch(err){
        console.error(err);
        errorFlash('Could not get checkouts.');
    }
}
function refreshUsersTable(users){
    console.log(users);
    const template = $('#users-table-template').html();
    const html = Mustache.render(template,users);
    $('#users-table-container').empty();
    $('#users-table-container').html(html);
}
async function getUsers(){
    try {
        const users = await $.ajax({
            method:'POST',
            url:'/users/get-all'
        });
        refreshUsersTable(users);
    }catch(err){
        errorFlash('Problem retrieving all users.');
    }
}
function buildRequestsTable(requests){
    if(requests.length===0){
        $('#all-requests').append('<p>Currently there are no requests</p>');
    }
    const template = $('#admin-request-entry').html();
    for(let i = 0; i < requests.length ; i = i + 1){
        $('#all-requests').append(Mustache.to_html(template,requests[i]));
    }
}
async function getRequests(){
    try {
        $('#all-requests').empty();
        const requests = await $.ajax({
            method: 'POST',
            url: '/requests/get-all',
            data:{}});
        buildRequestsTable(requests);
        setRequestTriggers();
    }
    catch(err){
        errorFlash(err);
    }
}
async function searchUsers(){
    await $('#email-search-results').slideUp('fast').promise().done();
    const template = $('#user-search-result').html();
    const email = $('#check-out-for-user-email').val();
    const users = await $.ajax({
        method:'POST',
        url:'/users/search',
        data:{email:email,limit:5}
    });
    const html = Mustache.render(template,users);
    $('#email-search-results').empty();
    $('#email-search-results').append(html);
    await $('#email-search-results').slideDown('fast').promise().done();
    applyUserSearchEffects();
}
function applyUserSearchEffects(){
    $('.email-search-result').mouseover(function(){
        $(this).css('background-color','#007bff');
        $(this).css('color','white');
    });
    $('.email-search-result').mouseleave(function(){
        $(this).css('background-color','white');
        $(this).css('color','#212529');
    });
    $('.email-search-result').on('click',function(){
        $('#check-out-for-user-email').val($(this).attr('email'));
    });
}
function setRequestTriggers(){
    $('.request-email-icon').on('click',(e)=>{
        try {
            const email = $(e.currentTarget).attr('email');
            $('#request-copy-email').text(email);
            const copyText = document.getElementById('request-copy-email');
            
            copyText.select();
            document.execCommand('copy');
            successFlash('Email copied to clipboard.');
        }
        catch(err){
            errorFlash(err);
        }
    });
    $('.request-delete-icon').on('click',async (e)=>{
        try {
            const _id = $(e.currentTarget).attr('_id');
            await $.ajax({
                method: 'POST',
                url: '/requests/delete',
                data:{_id:_id}
            });
            successFlash('Request deleted.');
            getRequests();
        }
        catch(err){
            errorFlash(err);
        }
    });
}
async function filterCheckOutResults(){
    const filter = getFormData('#filter-check-outs-form');
    const showPartsReturned = $('#show-parts-returned').prop('checked');
    //Build RegExpressions for Search
    const filterReg = new RegExp(filter['check-outs-filter'],'i');
    //Loop through each of the checkouts
    $('.to-filter').each(function(){
        //Search using RegExpressions
        const type = $(this).attr('type');
        var filterVal = $(this).attr('filter').search(filterReg);
        //Choose whether to display or not
        if(filterVal>=0)
        {
            if(type==='returned' && showPartsReturned===false)
            {
                $(this).css('display','none');
            }else{
                $(this).css('display','');
            }
        }
        else
        {
            $(this).css('display','none');
        }
    });
}

////To be run at start////
$(document).ready(function(){
    $('#logout').on('click',function(){
        $.ajax({
            method: 'GET',
            url: '/logout',
            data:{},
            success: function(res,status) {
                location.reload();
            },
            error: function(err,status){
            },
        });
    });
    //Filter the current checkouts
    $('.cause-filter').on('input',function(){
        filterCheckOutResults();
    });

    //Search tab
    $('#search-tab').on('click',async()=>{
        await closeAllContainers();
        $('#add-form').trigger('reset');
        $('#search-table-body').empty();
        searchParts();
        await $('#search-container').fadeIn('fast').promise().done();
        $('#search-tab').addClass('active');
    });
    //Check out tab
    $('#check-out-tab').on('click',async ()=>{
        updateCheckOuts();
        await closeAllContainers();
        $('#check-out-tab').addClass('active');
        await $('#check-out-container').fadeIn('fast').promise().done();
    });

    $('#requests-tab').on('click',async()=>{
        getRequests();
        await closeAllContainers();
        $('#requests-tab').addClass('active');
        await $('#requests-container').fadeIn('fast').promise().done();
    });

    $('#users-tab').on('click',async()=>{
        getUsers();
        await closeAllContainers();
        $('#users-tab').addClass('active');
        await $('#users-container').fadeIn('fast').promise().done();
    });
    
    //Modify entry button
    $('#modify-button').on('click',function(){
        //When you click on a part in the search menu, its _id is stored in #storePart
        const partID = $('#storePart').attr('_id');
        $.ajax({
            method: 'POST',
            url: '/parts/get-single-part',
            data: {_id:partID},
            success: function( res,status ) {
                $('#mod-cat').val(res.cat);
                $('#mod-partName').val(res.partName);
                $('#mod-subCat').val(res.subCat);
                $('#mod-val').val(res.val);
                $('#mod-partNum').val(res.partNum);
                $('#mod-loc').val(res.loc);
                $('#mod-qty').val(res.qty);
                $('#mod-notes').val(res.notes);
                $('#part-options').fadeOut('fast',function(){
                    $('#modify-form').fadeIn('fast',function(){
                    });
                });
            },
            error: function(err,status){
                errorFlash('Error modifying part');
            },
        });     
    });
    //Actually send the data to the server for modification in the database
    $('#modifyPart').on('click',function(){
        var data = getFormData('#modify-form');
        data._id = $('#storePart').attr('_id');
        $.ajax({
            method: 'POST',
            url: '/parts/modify',
            data: data,
            success: function( res,status ) {
                successFlash('Part was modified!');
                //Hide modal and redo a search
                $('#modify-delete-modal').modal('hide');
                createTimeout(searchParts);
            },
            error: function(err,status){
                errorFlash('Error modifying part');
            },
        });
    });
    //When the modal is hidden, reset the form
    $('#modify-delete-modal').on('hidden.bs.modal',function(){
        $('#modify-form').trigger('reset');
        $('#modify-form').hide();
        $('#part-options').show();
    });
    //Delete
    $('#delete-button').on('click',function(){
        var uniq_id = $('#storePart').attr('_id');
        //Send the uniq_id of a part to be deleted
        $.confirm({
            title: 'Confirmation',
            content: 'Confirm delete part?',
            buttons: {
                confirm: function () {
                    $.ajax({
                        method: 'POST',
                        url: '/parts/delete',
                        data: {
                            _id : uniq_id
                        },
                        success: function( res,status ) {
                            successFlash('Part was deleted!');
                            //New search to update table after deletion
                            createTimeout(searchParts);
                            $('#storePart').attr('_id','');
                            $('[_id='+uniq_id+']').remove();
                            $('#modify-delete-modal').modal('hide');
                        },
                        error: function(err,status){
                            errorFlash('Error deleting part');
                        },
                    });
                },
                cancel: function () {
                },
            }
        });
    });
    //Adding a new part
    $('#addPart').on('click', function(){
        var data = getFormData('#search-form');
        if(data.loc==''||data.partName==''||data.qty==''||data.cat=='')
        {
            errorFlash('Must have at least a part name, category, location, and quantity!');
            return;
        }
        $.ajax({
            method: 'POST',
            url: '/parts/add',
            data: data,
            success: function( res,status ) {
                successFlash('Part was added!');
                createTimeout(searchParts);
            },
            error: function(err,status){
                errorFlash('Error adding part');
            },
        });
    });
    //Clear search form, and get a new search with blank selections
    $('#clearSearchForm').on('click',function(){
        $('#search-form').trigger('reset');
        createTimeout(searchParts);
    });
    $('#show-new-user-form').on('click',async(e)=>{
        $('#add-user-modal').modal('show');
    });
    $('#show-check-out-for-user').on('click',async(e)=>{
        $('#modify-delete-modal').modal('hide');
        $('#check-out-for-user-modal').modal('show');
    });
    $('#check-out-for-user-email').on('input',async(e)=>{
        createTimeout(searchUsers);
    });
    $('#new-user-form').submit(async(e)=>{
        e.preventDefault();
        const formData = getFormData('#new-user-form');
        try {
            const response = await $.ajax({
                method:'POST',
                url:'/users/add-new',
                data:{
                    email:formData.newEmail,
                    confirmEmail:formData.newEmailConfirm
                }
            });
            console.log(response);
            successFlash('Added the new user.');
            $('#add-user-modal').modal('hide');
            await getUsers();
        }catch(err){
            console.log(err);
            errorFlash(err.responseJSON.message);
        }
    });
    $('.new-email-match').on('input',async()=>{
        const formData = getFormData('#new-user-form');
        const emailConfirm = $('#newEmailConfirm')[0];
        if(formData.newEmail!==formData.newEmailConfirm){
            emailConfirm.setCustomValidity('Emails Don\'t Match');
        }else{
            emailConfirm.setCustomValidity('');
        }
    });
    $('#submit-checkout-for-user-form').submit(async(e)=>{
        e.preventDefault();
        const formData = getFormData('#submit-checkout-for-user-form');
        formData.partID = $('#storePart').attr('_id');
        try{
            const response = await $.ajax({
                method:'POST',
                url:'/checkouts/add-checkout-admin',
                data:formData
            });
            successFlash('Check out added!');
            $('#check-out-for-user-modal').modal('hide');
        }catch(err){
            console.log(err);
            errorFlash(err.responseJSON.message);
        }
    });
    $('#slack-test-message-button').on('click',async()=>{
        await $.ajax({
            method: 'POST',
            url: '/slack/test-message',
            success: function( res,status ) {
                successFlash('Test message was sent!');
            },
            error: function(err,status){
                errorFlash('Error sending the message!');
            },
        });
    });
});