//eslint settings for jquery and Mustache.js
/*eslint-env jquery*/
/*global Mustache*/

//User notification flash
function successFlash(message)
{
    $('#successFlash').html('<strong>Success!</strong> '+message);
    $('#successFlash').fadeIn('fast',function(){
        setTimeout(function(){
            $('#successFlash').fadeOut('fast',function(){});
        },1000);
    });
}
function errorFlash(error)
{
    $('#errorFlash').html('<strong>Error!</strong> '+error);
    $('#errorFlash').fadeIn('fast',function(){
        setTimeout(function(){
            $('#errorFlash').fadeOut('fast',function(){});
        },1000);
    });
}

//Gets form data and returns it as an object
function getFormData(formID)
{
    var data = $(formID).serializeArray().reduce(function(obj, item) {
        obj[item.name] = item.value;
        return obj;
    }, {});
    //Take out ' and " characters.
    for(var key in data)
    {
        if(typeof(data[key])=='string'&&data[key]!='')
        {
            var newValue = data[key];
            newValue = newValue.replace(/'/g, '');
            newValue = newValue.replace(/"/g, '');
            data[key] = newValue;
        }
    }
    return data;
}

////Timeout Functions////
//These are used so that a POST request isn't generated on every character entry
var timeout = null; //Timeout for searches
//Create a timeout that can be reset based on a callback
function createTimeout(cb)
{
    clearTimeout(timeout);
    timeout = setTimeout(function()
    {
        cb();
    },500);
}
//Run after a timeout, rebuild the part-search table
function adminPartSearch()
{
    searchAndRebuildTable('#add-form','#search-table-body','result-row',100);
}
//Run after a timeout , checkout search form. Can't pass parameters into a callback.
function searchPartsCheckout()
{
    searchAndRebuildTable('#check-out-search-form','#check-out-search-body','check-out-result-row',15);
}

////Search function////
////Used for part search and checkout part search
//formID: DOM selector for form to take data from and do a search with
//tableID: DOM selector for table BODY to place results in
//rowClass: Class to give each row
//numRows: Number of rows to actually draw, stop after this many
function searchAndRebuildTable(formID,tableID,rowClass,numRows = 100)
{
    //Get data from a form
    const data = getFormData(formID);
    $.ajax({
        method: 'POST',
        url: '/parts/search',
        data: data,
        success: function( res,status ) {
            //Rebuild table
            $(tableID).empty();
            if(res.length>0)
            {
                if(res.length>numRows) //Cut extra rows if we don't want to display them
                {
                    res = res.splice(0,numRows);
                }
                res.forEach(function(result){
                    addToResults(result,tableID,rowClass);
                });
                //Attach handlers for mouse events and row clicks
                assignRowHighlights();
                assignRowClick();
                assignCheckOutClick();
            }
        },
        error: function(err,status){
            $(tableID).empty();
            $(tableID).append('<p>Error fetching results</p>');
        },
    });
} 


////After rebuilding a table need to reapply user interaction events////
//When you click a checkout row, show modal to select how much you want to select
function assignCheckOutClick()
{
    $('.check-out-result-row').on('click',function(){
        const _id = $(this).attr('_id');
        //Store the id for later
        $('#checkOutStorePart').attr('_id',_id);
        $('#qtyModal').modal('show');
    });
}
//Highlight rows
function assignRowHighlights()
{
    $('.result-row').on('mouseenter',function(){
        $(this).css('background-color', 'grey');
    });
    $('.result-row').on('mouseleave',function(){
        $(this).css('background-color', 'transparent');
    });
    $('.check-out-result-row').on('mouseenter',function(){
        $(this).css('background-color', 'grey');
    });
    $('.check-out-result-row').on('mouseleave',function(){
        $(this).css('background-color', 'transparent');
    });
}
function assignRowClick()
{
    $('.result-row').on('click',function(){
        const uniq_id = $(this).attr('_id');
        $('#storePart').attr('_id',uniq_id);
        $('#modify-delete-modal').modal('show');
    });
    $('.cart').on('click',function(){
        $(this).remove();
    });
}

////Add a row////
function addToResults(result,div,optClass){
    //Get template, found in index.pug
    var template = $('#admin-row-template').html();
    result.value = JSON.stringify(result);
    result.optClass = optClass;

    $(div).append(Mustache.to_html(template,result));
}

//Add a checkout entry
function addCheckoutResult(result)
{
    var check_part = '<img class="check-box-part" src="/images/check.png">';

    var table_template = $('#admin-checkout-table-template').html();
    var heading_template = $('#admin-checkout-table-heading-template').html();
    var entry_template = $('#admin-checkout-entry').html();

    $('#all-checkouts-container').append(Mustache.to_html(table_template,result));	
    $('[_id='+result._id+']').find('thead').find('tr').append(Mustache.to_html(heading_template,result));

    
    //Don't allow individual check in if there is only one entry in the checkout
    if(result.parts.length===1){
        check_part = '';
    }
    for(var i = 0; i < result.parts.length ; i = i + 1){
        var partData = result.parts[i];
        //Manually add this for MustacheJs
        partData.check_part = check_part;
        $('[_id='+result._id+']').find('tbody').append(Mustache.to_html(entry_template,partData));    
    } 
}
function getCheckOuts(){
    $.ajax({
        method: 'POST',
        url: '/checkouts/get-check-outs',
        data:{},
        success: function(res,status) {
            //Clear table
            $('#all-checkouts-container').empty();
            if(res.length !== 0){
                //Loop through and add it
                res.forEach(function(result){
                    addCheckoutResult(result);
                });
                setCheckOutTriggers();
                $('#check-out-search-body').empty();
                //Reset those forms
                $('#check-out-search-form').trigger('reset');
                $('#add-check-out-form').trigger('reset');
            }
        },
        error: function(err,status){
            errorFlash('Couldn\'t grab current checkouts.');
        },
    });
}
function buildRequestsTable(requests){
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

//Checkout form triggers only run when the checkouts are fetched or another is added
function setCheckOutTriggers(){
    //Check in all entries in a checkout
    $('.check-box-all').on('click',function(){
        //LOL get the unique _id of the check box
        var _id =$(this).parent().parent().parent().parent().attr('_id');
        //Confirm box for check in all
        $.confirm({
            title: 'Confirmation',
            content: 'Confirm this whole check in?',
            buttons: {
                confirm: function () {
                    $.ajax({
                        method: 'POST',
                        url: '/checkouts/check-in-all',
                        data: {
                            _id:_id
                        },
                        success: function( res,status ) {
                            successFlash('Checked in all of the parts!');
                            getCheckOuts();
                        },
                        error: function(err,status){
                            alert('Error checking in order');
                        },
                    });
                },
                cancel: function () {
                }
            }
        });
    });
    //Checking in just a part
    $('.check-box-part').on('click',function(){
        //The part _id to check in
        var part_id =$(this).parent().parent().attr('_id');
        //The checkout _id to modify
        var checkOut_id=$(this).parent().parent().parent().parent().attr('_id');
        $.confirm({
            title: 'Confirmation',
            content: 'Confirm this part is being checked in',
            buttons: {
                confirm: function () {
                    $.ajax({
                        method: 'POST',
                        url: '/checkouts/check-in-part',
                        data: {
                            part_id:part_id,
                            checkOut_id:checkOut_id
                        },
                        success: function( res,status ) {
                            successFlash('Checked in that part!');
                            getCheckOuts();
                        },
                        error: function(err,status){
                            alert('Error checking in part');
                        },
                    });
                },
                cancel: function () {

                }
            }
        });
		
    });
    //Add parts from the cart into an already existing checkout
    $('.plus-box').on('click',function(){
        var formData = {};
        var parts = [];
        var numParts = $('#current-check-out').children().length;
        if(numParts==0)
        {
            errorFlash('No items in current check out cart!');
            return;
        }
        $('#current-check-out').children().each(function(){
            const partID = $(this).attr('_id');
            const amountToCheckOut = parseInt($(this).attr('amountToCheckOut'));
            parts.push({_id:partID,amountToCheckOut:amountToCheckOut});
        });
        formData.checkOut_id=$(this).parent().parent().parent().parent().attr('_id');
        formData.parts = parts;
        //No items in the cart
        $.confirm({
            title: 'Confirmation',
            content: 'Confirm this part addition',
            buttons: {
                confirm: function () {
                    $.ajax({
                        method: 'POST',
                        url: '/checkouts/add-part-post-check-out',
                        contentType: 'application/json',
                        data: JSON.stringify(formData),
                        success: function( res,status ) {
                            successFlash('Added those parts!');
                            getCheckOuts();
                            $('#current-check-out').empty();
                        },
                        error: function(err,status){
                            alert('Error checking in part');
                        },
                    });
                },
                cancel: function () {
            
                }
            }
        });
    });
}
////To be run at start////
$(document).ready(function(){
//Filter the current checkouts
    $('.filter').on('input',function(){
        var formData = getFormData('#filter-checkouts');
        //Loop through each of the checkouts
        $('#all-checkouts-container').children().each(function(){
            //Build RegExpressions for Search
            var fnameReg = new RegExp(formData.fname,'i');
            var lnameReg = new RegExp(formData.lname,'i');
            var dNumReg = new RegExp(formData.dNum,'i');
            var fnumReg = new RegExp(formData.fNum,'i');

            //Search using RegExpressions
            var fnameVal = $(this).attr('fname').search(fnameReg);
            var lnameVal = $(this).attr('lname').search(lnameReg);
            var dNumVal = $(this).attr('dnum').search(dNumReg);
            var fnumVal = $(this).attr('fnum').search(fnumReg);
            var sum = fnameVal + lnameVal + dNumVal + fnumVal;
            //Choose whether to display or not
            if(sum>=0)
            {
                $(this).css('display','');
            }
            else
            {
                $(this).css('display','none');
            }
        });
    });

    ////USER INTERFACE////
    //Modal options
    $('#modify-delete-modal').modal(
        {
            keyboard:true,
            show:false,
            focus:false
        });
    //Search tab
    $('#search-tab').on('click',function(){
        $('#search-table-body').empty();
    });
    //Logout
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
    //Check out tab
    $('#check-out-tab').on('click',function(){
        //Grab all of the check-outs
        getCheckOuts();
    });

    $('#requests-tab').on('click',()=>{
        getRequests();
    });
    
    //Search form for checkout parts
    $('#check-out-cat,#check-out-partName,#check-out-subCat,#check-out-val,#check-out-partNum,#check-out-loc').on('input',function(){
        createTimeout(searchPartsCheckout);
    });
    //Add new checkout
    $('#addCheckOutButton').on('click',function(){
        var formData = getFormData('#add-check-out-form');
        //Missing info for the checkout
        if(formData.fname==''||formData.lname==''||formData.dNum==''||formData.fNum==''||formData.dateDue=='')
        {
            errorFlash('Missing Information about the person checking out!');
            return;
        }
        //Number of parts in checkout is 0
        var numParts = $('#current-check-out').children().length;
        if(numParts==0)
        {
            errorFlash('No items in current check out cart!');
            return;
        }
        var parts = [];
        //Save each entry into JS memory
        $('#current-check-out').children().each(function(){
            const partID = $(this).attr('_id');
            const amountToCheckOut = parseInt($(this).attr('amountToCheckOut'));
            parts.push({_id:partID,amountToCheckOut:amountToCheckOut});
        });
        formData.parts = parts;
        //Send that to the server
        $.ajax({
            method: 'POST',
            url: '/checkouts/add-check-out',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            success: function( res,status ) {
                //Reset those forms
                $('#add-check-out-form').trigger('reset');
                $('#check-out-search-form').trigger('reset');
                $('#current-check-out').empty();
                $('#check-out-tab').trigger('click');
                successFlash('Checkout Added!');
            },
            error: function(err,status){
                if(status == 'error')
                {
                    errorFlash('That form number is probably already in use');
                }
                else
                {
                    errorFlash('Some error occured talking to the server!');
                }
            },
        });
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
                alert('Error modifying part');
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
                createTimeout(adminPartSearch);
            },
            error: function(err,status){
                alert('Error modifying part');
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
                            createTimeout(adminPartSearch);
                            $('#storePart').attr('_id','');
                            $('[_id='+uniq_id+']').remove();
                            $('#modify-delete-modal').modal('hide');
                        },
                        error: function(err,status){
                            alert('Error deleting part');
                        },
                    });
                },
                cancel: function () {
                },
            }
        });
    });
    //Set quantity for a checkout item
    $('#addQty').on('click',function(){
        var formData = getFormData('#quantity-form');
        if(formData.amountToCheckOut<=0)
        {
            errorFlash('Invalid amount to check out.');
            return;
        }
        $('#quantity-form').trigger('reset');
        var partObj = {};
        partObj._id = $('#checkOutStorePart').attr('_id');
        partObj.amountToCheckOut = formData.amountToCheckOut;
        //Find the row clicked copy it and change its class and set relevent data and append it to the cart
        $('[_id="'+$('#checkOutStorePart').attr('_id')+'"]').filter('.check-out-result-row').clone().removeClass('check-out-result-row').addClass('cart').attr('amountToCheckout',formData.amountToCheckOut).append('<tr">'+formData.amountToCheckOut+'</tr>').appendTo('#current-check-out');
        assignRowClick();
        $('#qtyModal').modal('hide');
        $('#quantity-form').trigger('reset');
        $('#check-out-search-form').trigger('reset');
        $('#check-out-search-body').empty();
    });
    //Adding a new part
    $('#addPart').on('click', function(){
        var data = getFormData('#add-form');
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
                createTimeout(adminPartSearch);
                assignRowHighlights();
                assignRowClick();
            },
            error: function(err,status){
                alert('Error adding part');
            },
        });
    });
    //Add form is also the search form, on change set up a new change
    $('.add-form-input').on('input',function(){
        createTimeout(adminPartSearch);
    });
    //Clear search form, and get a new search with blank selections
    $('#clearAddPart').on('click',function(){
        $('#add-form').trigger('reset');
        createTimeout(adminPartSearch);
    });
});