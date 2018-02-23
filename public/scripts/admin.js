function assignRowClick()
{
	$('.result-row').on("click",function(){
		uniq_id = $(this).attr('value')
		$("#storePart").attr('value',uniq_id)
		$("#invModal").modal('show');
	});
};
$(document).ready(function(){
	$('#invModal').modal(
	{
		keyboard:true,
		show:false,
		focus:false
	}
	)
	$('#delete-button').on('click',function(){
		uniq_id = $("#storePart").attr('value');
		$.ajax({
            method: "POST",
            url: "/delete",
            data: {
				id : uniq_id
			},
            success: function( res,status ) {
				$("#storePart").attr('value',"");
				$("[value="+uniq_id+"]").remove();
				$("#invModal").modal('hide');
            },
            error: function(err,status){
				alert('Error deleting part');
            },
        });
	});
});
