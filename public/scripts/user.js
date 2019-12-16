//eslint settings for jquery and Mustache.js
/*eslint-env jquery*/
/*global Mustache*/
/*global getFormData*/
/*global successFlash*/
/*global errorFlash*/
/*global createTimeout*/
/*global closeAllContainers*/
/*global searchParts*/

function buildUserCheckOutMustachObject(data){
    console.log(data);
    
    console.log(data.length);
    const mustacheObject = {hasOut:false,hasApproved:false,hasUnapproved:false,hasReturned:false,unapproved:[],approved:[],out:[],returned:[]};
    //Loop through each checkOut entry
    for(let i=0;i<data.length;i=i+1){
        const checkOut = data[i];
        switch(checkOut.type){
        case 'unapproved':
            mustacheObject.unapproved.push(checkOut);
            mustacheObject.hasUnapproved = true;
            break;
        case 'approved':
            mustacheObject.approved.push(checkOut);
            mustacheObject.hasApproved = true;
            break;
        case 'out':
            mustacheObject.out.push(checkOut);
            mustacheObject.hasOut = true;
            break;
        case 'returned':
            mustacheObject.returned.push(checkOut);
            mustacheObject.hasReturned = true;
            break;
        default:
            errorFlash('Bad checkout type received!');
            console.log(mustacheObject);
        }
    }
    return mustacheObject;
}
function refreshCheckOutTable(mustacheObject){
    const template = $('#check-out-template').html();
    const html = Mustache.render(template,mustacheObject);
    $('#check-outs-container').html(html);
}
function addClickEventsCheckOutTable(){
    $('.unapproved-check-out').mouseover(function(){
        $(this).css('background-color','#007bff');
        $(this).css('color','white');
    });
    $('.unapproved-check-out').mouseleave(function(){
        $(this).css('background-color','white');
        $(this).css('color','#212529');
    });
    $('.unapproved-check-out').on('click',function(){
        const uniq_id = $(this).attr('_id');
        $('#store-check-out').attr('_id',uniq_id);
        $('#modify-unapproved-check-out-modal-title').text('Change quantity of your check out for:' + $(this).attr('partName'));
        $('#modify-check-out-qty').val($(this).attr('amountToCheckOut'));
        $('#modify-check-out-modal').modal('show');
    });
}
async function refreshRequests(requests){
    $('#user-requests').empty();
    const template = $('#request-entry-template').html();
    requests.forEach(function(request,i){
        const html = Mustache.render(template,request);
        $('#user-requests').append(html);
    });
}
async function getUserRequests(){
    try{
        const requests = await $.ajax({
            method: 'POST',
            url: '/requests/get-user-requests'
        });
        refreshRequests(requests);
    }catch(err){
        errorFlash('Could not fetch your requests!');
    }
}
async function updateCheckOuts(){
    try{
        const data = await $.ajax({
            method: 'POST',
            url: '/checkouts/get-user-check-outs'
        });
        const mustacheObject = buildUserCheckOutMustachObject(data);
        refreshCheckOutTable(mustacheObject);
        addClickEventsCheckOutTable();
    }catch(err){
        console.error(err);
        errorFlash('Could not get checkouts.');
    }
}

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
    ////USER INTERFACE////
    //Search tab
    $('#search-tab').on('click',async()=>{
        await closeAllContainers();
        $('#add-form').trigger('reset');
        $('#search-table-body').empty();
        await $('#search-container').fadeIn('fast').promise().done();
        $('#search-tab').addClass('active');
        searchParts();
    });
    //Check out tab
    $('#check-out-tab').on('click',async ()=>{
        await updateCheckOuts();
        await closeAllContainers();
        $('#check-out-tab').addClass('active');
        await $('#check-out-container').fadeIn('fast').promise().done();
    });

    $('#requests-tab').on('click',async()=>{
        getUserRequests();
        await closeAllContainers();
        $('#requests-tab').addClass('active');
        await $('#requests-container').fadeIn('fast').promise().done();
    });
    $('#qty-form').submit(async(e)=>{
        e.preventDefault();
        const formData = getFormData('#qty-form');
        const data = formData;
        data._id = $('#storePart').attr('_id');
        console.log(data);
        try{
            await $.ajax({
                method:'POST',
                url:'/checkouts/add-unapproved',
                data:formData
            });
            successFlash('Part was added to your unapproved checkouts.');
            $('#qty-modal').modal('hide');
            $('#qty-form').trigger('reset');
        }
        catch(err){
            errorFlash(err.responseText);
            console.log(err);
        }
    });
    $('#request-form').submit(async(e)=>{
        e.preventDefault();
        const formData = getFormData('#request-form');
        try{
            await $.ajax({
                method:'POST',
                url:'/requests/add',
                data:formData
            });
            successFlash('Request submitted!');
            $('#request-form').trigger('reset');
            getUserRequests();
        }catch(err){
            errorFlash('Request could not be submitted!');
        }

    });
    $('#remove-unapproved-check-out').on('click',async ()=>{
        const data = {_id:$('#store-check-out').attr('_id')};
        try{
            await $.ajax({
                method:'POST',
                url:'/checkouts/remove-unapproved',
                data:data
            });
            successFlash('Checkout removed!');
            $('#modify-check-out-modal').modal('hide');
            updateCheckOuts();
        }catch(err){
            console.log(err);
            errorFlash(err.responseText);
        }
    });
    $('#modify-check-out-form').submit(async(e)=>{
        e.preventDefault();
        const formData = getFormData('#modify-check-out-form');
        formData._id = $('#store-check-out').attr('_id');
        try{
            await $.ajax({
                method:'POST',
                url:'/checkouts/modify-unapproved',
                data:formData
            });
            successFlash('Modified checkout!');
            $('#modify-check-out-modal').modal('hide');
            updateCheckOuts();
        }
        catch(err){
            console.log(err);
            errorFlash(err.responseText);
        }
    });
});