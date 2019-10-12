//eslint settings for jquery and Mustache.js
/*eslint-env jquery*/
/*global Mustache*/
//Timout shared between functions
var timeout = null;
$(document).ready(function(){
    ////FUNCTIONS TO RUN AT START////
    //Bootstrap enable tooltip
    $(function () {
        $('[data-toggle="tooltip"]').tooltip();
    });

    ////DOM MANIPULATION FUNCTIONS////
    //Add a result row from a mustache template
    function addToResults(result,div)
    {
        //Get template, found in index.pug
        var template = $('#result-row-template').html();

        //Store whole data in value field of template
        result.value = JSON.stringify(result);

        $(div).append(Mustache.to_html(template,result));
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

    ////TRIGGERS ASSIGNMENT FUNCTIONS////
    //Add triggers to result rows
    function assignMouseEvents()
    {
        $('.result-row').on('mouseenter',function(){
            $(this).css('background-color', 'grey');
        });
        $('.result-row').on('mouseleave',function(){
            $(this).css('background-color', 'transparent');
        });
    }

    ////Flash Messages////
    //Add message to either errorFlash or successFlash then show it and fade it out
    //Can be found in index.pug
    function errorFlash(error)
    {
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
        $('#successFlash').html('<strong>Success!</strong> '+message);
        $('#successFlash').fadeIn('fast',function(){
            setTimeout(function(){
                $('#successFlash').fadeOut('fast',function(){
                });
            },1000);
        });
    }

    ////No-login search: search for people that are not logged in///
    //On input in the search form, start a timeout
    $('.no-login-input').on('input',function(){
        addNoLoginSearch();
    });
    //Throttle timeout so a search isn't made for every key input
    function addNoLoginSearch(){
        clearTimeout(timeout);
        timeout = setTimeout(function()
        {
            noLoginSearch();
        },750);
    }
    //Actual search function
    function noLoginSearch()
    {
        var data = getFormData('#search-form');
        $.ajax({
            method: 'POST',
            url: '/parts/search',
            data: data,
            success: function( res,status ) {
                //Flush search results
                $('#search-table-body').empty();
                
                //If we get results
                if(res.length != 0)
                {
                    //Go through results and add to results table
                    res.forEach(function(result){
                        addToResults(result,'#search-table-body');
                    });
                    //Assign mouse events to the new rows
                    assignMouseEvents();
                }
            },
            error: function(err,status){
                errorFlash('Could not complete search');
            }
        });
    }

    ////Login Functions////
    //Shows login screen on clicking the button
    $('#show-login').on('click',function(){
        $('#show-login').fadeOut('fast',function(){
            $('#login-container').fadeIn('fast',function(){});
        });
    });

    ////Navigating between search and check-outs tabs////
    $('#search-tab').on('click',async ()=> {
        //Clear results
        $('#search-table-body').empty();
        //Modify how the screen looks and what is displayed
        if(!$(this).hasClass('active'))
        {
            await $('#check-out-container').fadeOut('fast').promise().done();
            await $('#requests-container').fadeOut('fast').promise().done();
            await $('#search-container').fadeIn('fast').promise().done();
            $('#top-nav').find('.active').removeClass('active');
            $('#top-nav').find('#search-tab').addClass('active');
        }
    });
    $('#check-out-tab').on('click',async ()=>{
        if(!$(this).hasClass('active'))
        {
            await $('#requests-container').fadeOut('fast').promise().done();
            await $('#search-container').fadeOut('fast').promise().done();
            await $('#check-out-container').fadeIn('fast').promise().done();
            $('#top-nav').find('.active').removeClass('active');
            $('#top-nav').find('#check-out-tab').addClass('active');          
        }
    });
    $('#requests-tab').on('click',async ()=>{
        if(!$(this).hasClass('active')){
            await $('#check-out-container').fadeOut('fast').promise().done();
            await $('#search-container').fadeOut('fast').promise().done();
            await $('#requests-container').fadeIn('fast').promise().done();
            $('#top-nav').find('.active').removeClass('active');
            $('#top-nav').find('#requests-tab').addClass('active');    
        }
    });

    ////Check-out tab functions////
    //A user searching for their checkout
    $('#check-check-out-form').submit(async (e)=>{
        e.preventDefault();
        try{
            const formData = getFormData('#check-check-out-form');
            const result = await $.ajax({
                method: 'POST',
                url: '/checkouts/check-check-out',
                data: formData
            });
            console.log(result);
            $('#your-check-out').empty();
            if(result.length==0)
            {
                errorFlash('Could not find your checkout!');
                return;
            }
            else{
                addCheckoutResult(result);
            }
        }
        catch(err){
            errorFlash('Error communicating with the server.');
        }
    });	
    function addCheckoutResult(result)
    {
        //Load from template and append
        var table_template = $('#checkout-table-template').html();
        $('#your-check-out').append(Mustache.to_html(table_template,result));
        
        //Load entry template
        const entry_template = $('#checkout-entry-template').html();
        //For each part use the entry template
        for(var i = 0; i < result.parts.length;i=i+1)
        {
            const part = result.parts[i];
            const toAppend =  Mustache.to_html(entry_template,part);
            $('[_id='+result._id+']').find('tbody').append(toAppend);
        } 
    }

    //Submit Request Button
    $('#request-form').submit(async (e)=>{
        e.preventDefault();
        try{
            const formData = getFormData('#request-form');
            await $.ajax({
                method:'POST',
                url:'/requests/add',
                data:formData
            });
            successFlash('Request submitted!');
            await $('#before-request').fadeOut('fast').promise().done();
            await $('#after-request').fadeIn('fast').promise().done();
        }
        catch(err){
            errorFlash('Could not submit request. There is a server issue.');
        }
    });

    $('#login-form').submit(async(e)=>{
        e.preventDefault();
        try{
            const formData = getFormData('#login-form');
            await $.ajax({
                method:'POST',
                url:'/login',
                data:formData
            });
            location.reload();
        }
        catch(err){
            errorFlash('Unable to login, check that you have the correct username and password.');
        }
    });

});
