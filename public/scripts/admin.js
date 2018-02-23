function assignRowClick()
{
	$('.result-row').on("click",function(){
		uniq_id = $(this).attr('value')
		$("#storePart").attr('value',uniq_id)
		$("#invModal").modal('show');
	});
};
function getFormData(formID)
	{
		var data = $(formID).serializeArray().reduce(function(obj, item) {
			obj[item.name] = item.value;
			return obj;
		}, {});
		return data;
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
	 $("#addPart").on("click", function(){
		var data = getFormData('#add-form');
		$.ajax({
            method: "POST",
            url: "/add",
            data: data,
            success: function( res,status ) {
            },
            error: function(err,status){
				alert('Error adding part');
            },
        });
	 });
});
