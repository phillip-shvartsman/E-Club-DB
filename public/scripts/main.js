//eslint settings for jquery and Mustache.js
/*eslint-env jquery*/
/*global Mustache*/
/*global getFormData*/
/*global successFlash*/
/*global errorFlash*/
/*global createTimeout*/



$(document).ready(function(){
    ////Login Functions////
    //Shows login screen on clicking the button
    $('#show-login').on('click',async()=>{
        await $('#buttons-container').fadeOut('fast').promise().done();
        await $('#login-container').fadeIn('fast').promise().done();
    });
    $('#show-register').on('click',async()=>{
        await $('#buttons-container').fadeOut('fast').promise().done();
        await $('#register-container').fadeIn('fast').promise().done();
    });
    $('.cancel-login-register').on('click',async()=>{
        await $('#login-container').fadeOut('fast').promise().done();
        await $('#register-container').fadeOut('fast').promise().done();
        await $('#buttons-container').fadeIn('fast').promise().done();
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

    $('.password-match').on('input',async()=>{
        const formData = getFormData('#register-form');
        const passwordConfirm = $('#passwordConfirm')[0];
        if(formData.password!==formData.passwordConfirm){
            passwordConfirm.setCustomValidity('Passwords Don\'t Match');
        }else{
            passwordConfirm.setCustomValidity('');
        }
    });

    $('#register-form').submit(async(e)=>{
        e.preventDefault();
        const formData = getFormData('#register-form');
        const passwordConfirm = $('#passwordConfirm')[0];
        if(formData.password!==formData.passwordConfirm){
            passwordConfirm.setCustomValidity('Passwords Don\'t Match');
            return;
        }else{
            passwordConfirm.setCustomValidity('');
        }
        try{
            const formData = getFormData('#register-form');
            await $.ajax({
                method:'POST',
                url:'/register',
                data:formData
            });
            location.reload();
        }
        catch(err){
            console.error(err);
            errorFlash('Unable to register, most likely that the username is already in use.');
        }
    });

});
