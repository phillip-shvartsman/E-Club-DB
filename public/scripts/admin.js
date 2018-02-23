function assignRowClick()
{
	$('.result-row').on("click",function(){
		uniq_id = $(this).attr('value');
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
	$('#modify-button').on('click',function(){
		partObj = JSON.parse($("#storePart").attr('value'));
		$('#mod-cat').val(partObj.cat);
		$('#mod-partName').val(partObj.partName);
		$('#mod-subCat').val(partObj.subCat);
		$('#mod-val').val(partObj.val);
		$('#mod-partNum').val(partObj.partNum);
		$('#mod-loc').val(partObj.loc);
		$('#mod-qty').val(partObj.qty);
		$('#mod-notes').val(partObj.notes);
		$('#part-options').fadeOut('fast',function(){
			$('#modify-form').fadeIn('fast',function(){
			});
		});
	});
	$('#modifyPart').on('click',function(){
		partObj = JSON.parse($("#storePart").attr('value'));
		var data = getFormData('#modify-form');
		data["_id"] = partObj._id;
		$.ajax({
            method: "POST",
            url: "/modify",
            data: data,
            success: function( res,status ) {
				$('#modifyPartSuccess').fadeIn('fast',function(){
					setTimeout(function(){
						$('#modifyPartSuccess').fadeOut('fast',function(){
						});
					},500);
				});
				$("#invModal").modal('hide');
				$('#searchPart').trigger('click');
            },
            error: function(err,status){
				alert('Error modifying part');
            },
        });
	});
	$('#invModal').on('hidden.bs.modal',function(){
		$('#mod-cat').val("");
		$('#mod-partName').val("");
		$('#mod-subCat').val("");
		$('#mod-val').val("");
		$('#mod-partNum').val("");
		$('#mod-loc').val("");
		$('#mod-qty').val("");
		$('#mod-notes').val("");
		$('#part-options').show();
		$('#modify-form').hide();
	});
	$('#delete-button').on('click',function(){
		partObj = JSON.parse($("#storePart").attr('value'));
		uniq_id = partObj._id;
		$.ajax({
            method: "POST",
            url: "/delete",
            data: {
				_id : uniq_id
			},
            success: function( res,status ) {
				$('#deletePartSuccess').fadeIn('fast',function(){
					setTimeout(function(){
						$('#deletePartSuccess').fadeOut('fast',function(){
						});
					},500);
				});
				$('#searchPart').trigger('click');
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
				$('#addPartSuccess').fadeIn('fast',function(){
					setTimeout(function(){
						$('#addPartSuccess').fadeOut('fast',function(){
						});
					},500);
					$('#searchPart').trigger('click');
				});
            },
            error: function(err,status){
				alert('Error adding part');
            },
        });
	 });
});
