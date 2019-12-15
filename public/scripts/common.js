//eslint settings for jquery and Mustache.js
/*eslint-env jquery*/
/*global Mustache*/

var timeout = null;
//Create a timeout that can be reset based on a callback
function createTimeout(cb)
{
    clearTimeout(timeout);
    timeout = setTimeout(function()
    {
        cb();
    },500);
}

////Flash Messages////
//Add message to either errorFlash or successFlash then show it and fade it out
//Can be found in index.pug
function errorFlash(error)
{
    $('#errorFlash').hide();
    $('#errorFlash').html('<strong>Error!</strong> '+error);

    $('#errorFlash').fadeIn('fast',function(){
        setTimeout(function(){
            $('#errorFlash').fadeOut('fast',function(){
            });
        },1000);
    });
    
}
function successFlash(message)
{
    $('#successFlash').hide();
    $('#successFlash').html('<strong>Success!</strong> '+message);
    $('#successFlash').fadeIn('fast',function(){
        setTimeout(function(){
            $('#successFlash').fadeOut('fast',function(){
            });
        },1000);
    });
}
async function applyRowEffects(){
    $('.result-row').mouseover(function(){
        $(this).css('background-color','#007bff');
        $(this).css('color','white');
    });
    $('.result-row').mouseleave(function(){
        $(this).css('background-color','white');
        $(this).css('color','#212529');
    });
    //Only Used For Admin
    $('.result-row').on('click',function(){
        const uniq_id = $(this).attr('_id');
        $('#storePart').attr('_id',uniq_id);
        $('#modify-delete-modal').modal('show');
    });
    //Only for User
    $('.result-row').on('click',function(){
        const uniq_id = $(this).attr('_id');
        $('#storePart').attr('_id',uniq_id);
        $('#qty-modal').modal('show');
    });
}
async function updateResultsTable(data){
    const template = $('#result-row-template').html();
    $('#search-table-body').empty();
    data.forEach(async (result,index)=>{
        const entry = Mustache.render(template,result);
        $('#search-table-body').append(entry);
    });
    applyRowEffects();
}
async function searchParts(){
    var formData = getFormData('#search-form');
    var data = await $.ajax({
        method:'POST',
        data:formData,
        url:'/parts/search'
    });
    updateResultsTable(data);
}

//Get data from a form store based on name
function getFormData(formID)
{
    //Serialize the array from the form and build an object from it.
    var data = $(formID).serializeArray().reduce(function(obj, item) 
    {
        obj[item.name] = item.value;
        return obj;
    }, {});
    //Remove ‘ and “ characters from input
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
async function closeAllContainers(){
    if($('#search-container').is(':visible')){
        await $('#search-container').fadeOut('fast').promise().done();  
    }
    if($('#check-out-container').is(':visible')){
        await $('#check-out-container').fadeOut('fast').promise().done(); 
    }
    if($('#requests-container').is(':visible')){
        await $('#requests-container').fadeOut('fast').promise().done();
    }  
    $('#requests-tab').removeClass('active');
    $('#search-tab').removeClass('active');
    $('#check-out-tab').removeClass('active');
    return Promise.resolve();
}

$(document).ready(function(){
    $('.part-search-input').on('input',async()=>{
        createTimeout(searchParts);
    });
});
