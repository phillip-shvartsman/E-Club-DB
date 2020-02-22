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

    $('#forgot-password').on('click',async()=>{
        const formData = getFormData('#login-form');
        $('#forgot-password-email').val(formData.email);
        $('#forgot-password-modal').modal('show');
    });
    $('#forgot-password-form').submit(async(e)=>{
        e.preventDefault();
        try {
            const formData = getFormData('#forgot-password-form');
            await $.ajax({
                method:'POST',
                url:'/reset-password',
                data:formData
            });
            $('#forgot-password-modal').modal('hide');
            $('#forgot-password-form').trigger('reset');
            successFlash('You have been sent a reset password link, please check your email',3000);
        }
        catch(err){
            console.log(err);
            errorFlash('Unable to reset password verify that there is account for this email.');
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
            var getUrl = window.location;
            var baseUrl = getUrl .protocol + '//' + getUrl.host;
            history.pushState('data to be passed', 'Title of the page', '/');
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

    $('.new-password-match').on('input',async()=>{
        const formData = getFormData('#reset-password-form');
        const passwordConfirm = $('#newPasswordConfirm')[0];
        if(formData.newPassword!==formData.newPasswordConfirm){
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

    $('#reset-password-form').submit(async(e)=>{
        e.preventDefault();
        const formData = getFormData('#reset-password-form');
        formData.password = formData.newPassword;
        formData.passwordConfirm = formData.newPasswordConfirm;
        formData.token = $('#new-password-token').attr('value');
        formData.userID = $('#new-password-userID').attr('value');
        try {
            const response = await $.ajax({
                method:'POST',
                url:'/set-new-password',
                data:formData
            });
            $('#login-email').val(response.email);
            $('#login-password').val(formData.password);
            $('#login-form').submit();
        } catch(err){
            console.log(err);
            errorFlash('There was an error setting your new password.');
        }

    });
    $('#reset-password-modal').modal('show');
});
