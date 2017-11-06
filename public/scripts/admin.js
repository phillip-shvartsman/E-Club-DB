$(document).ready(function(){
    $("#submitPart").on("click", function(){
        alert("test");
        $.ajax({
            method: "POST",
            url: "/add",
            data: {
                partName:"Raspberry Pi" , 
                quantity: "4" , 
                category: "MCU"  
            },
            success: function( res,status ) {
                alert( res );
            },
            error: function(err,status){
                alert(err);
            },
        });
    });
    
})
