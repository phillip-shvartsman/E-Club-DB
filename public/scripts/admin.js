////TIMEOUT FUNCTIONS////
var timeout = null; //Timeout for seach
function addPartSearch()
{
	clearTimeout(timeout);
	timeout = setTimeout(function()
	{
		searchParts();
	},500);
};
function addAdminPartSearch()
{
	clearTimeout(timeout);
	timeout = setTimeout(function()
	{
		adminPartSearch();
	},500);
};
////SEARCH/HELPER FUNCTIONS////
function adminPartSearch()
{
	var data = getFormData('#add-form');
	$.ajax({
		method: "POST",
		url: "/search",
		data: data,
		success: function( res,status ) {
			$('#search-table-body').empty();
			if(res.length == 0)
			{
			}
			else
			{
				res.forEach(function(result){
					addToResults(result,'#search-table-body','result-row');
				});
				assignMouseEvents();
				assignRowClick();
			}
		},
		error: function(err,status){
			$('#search-table-body').empty();
			$('#search-table-body').append("<p>Error fetching results</p>");
		},
	});
}
function searchParts()
{
	var data = getFormData('#check-out-search-form');
	$.ajax({
		method: "POST",
		url: "/search",
		data: data,
		success: function( res,status ) {
			console.log(res);
			$('#check-out-search-body').empty();
			if(res.length == 0)
			{
			}
			else
			{
				res.forEach(function(result){
					addToResults(result,'#check-out-search-body','check-out-result-row');
				});
				assignCheckOutMouseEvents();
				assignCheckOutClick();
			}
		},
		error: function(err,status){
			$('#check-out-search-container').empty();
			$('#check-out-search-container').append("<p>Error fetching results</p>");
		},
	});
}
////ASSIGN TRIGGER FUNCTIONS////
function assignCheckOutMouseEvents()
{
	$(".check-out-result-row").on('mouseenter',function(){
		$(this).css('background-color', 'grey');
	});
	$(".check-out-result-row").on('mouseleave',function(){
		$(this).css('background-color', 'transparent');
	});
}
function assignCheckOutClick()
{
	$('.check-out-result-row').on("click",function(){
		uniq_id = $(this).attr('value');
		$("#checkOutStorePart").attr('value',uniq_id)
		$("#qtyModal").modal('show');
	});
}
function assignMouseEvents()
{
	$(".result-row").on('mouseenter',function(){
		$(this).css('background-color', 'grey');
	});
	$(".result-row").on('mouseleave',function(){
		$(this).css('background-color', 'transparent');
	});
}
////TRIGGER ASSIGNMENT FUNCTIONS////
function assignRowClick()
{
	$('.result-row').on("click",function(){
		uniq_id = $(this).attr('value');
		$("#storePart").attr('value',uniq_id)
		$("#invModal").modal('show');
	});
	$('.cart').on('click',function(){
		$(this).remove();
	});
};
////DOM MANIPULATION FUNCTIONS////
function addToResults(result,div,optClass)
	{
		$(div).append("<tr class='"+optClass+"' value='"+JSON.stringify(result)+"'>"+
		"<td>"+result.partName+"</td>"+
		"<td>"+result.cat+"</td>"+
		"<td>"+result.subCat+"</td>"+
		"<td>"+result.val+"</td>"+
		"<td>"+result.partNum+"</td>"+
		"<td>"+result.loc+"</td>"+
		"<td>"+result.qty+"</td>"+
		"<td>"+result.amountCheckedOut+"</td>"+
		"<td>"+result.notes+"</td>"+
		"</tr>");
	}
function getFormData(formID)
{
	var data = $(formID).serializeArray().reduce(function(obj, item) {
		obj[item.name] = item.value;
		return obj;
	}, {});
	return data;
};
function addCheckoutResult(result)
{
	var check = "<img class='check-box-all' src='/images/check.png'>";
	var check_part = "<img class='check-box-part' src='/images/check.png'>";
	var plus = "<img class='plus-box' src='/images/plus.png'>";
	var table = "<table class='table table-sm check-out-table' fNum='"+result['fNum']+"' dNum='"+result['dNum']+"' fname='"+result['fname']+"' lname='"+result['lname']+"' value='"+result['_id']+"'>"+
	"<thead>"+
	"<tr>"+
	"</tr>"+
	"</thead>"+
	"<tbody>"+
	"</tbody>"+
	"</table>";
	heading="<th>"+result['fname']+" "+result['lname']+"</th>"+
	"<th>Dot # "+result['dNum']+"</th>"+
	"<th>Form # "+result['fNum']+"</th>"+
	"<th>Due on "+result['dateDue']+"</th>"+
	"<td>"+plus+check+"</td>";
	$('#all-checkouts-container').append(table);
	$("[value="+result['_id']+"]").find('thead').find('tr').append(heading);
	for(var key in result)
	{
		if(key!='fname'&&key!='lname'&&key!='dateDue'&&key!='_id'&&key!='dNum'&&key!='fNum'&&key!='checkedIn')
		{
			jsonData = JSON.parse(result[key]);
			entry = "<tr class='checked-out-part' value='"+jsonData['_id']+"'><td>"+jsonData['amountToCheckOut']+"</td><td>"+jsonData['partName']+"</td><td>"+jsonData['partNum']+"</td><td>"+check_part+"</td></tr>";
			$("[value="+result['_id']+"]").find('tbody').append(entry);
		}
	} 
}
$(document).ready(function(){
////FUNCTIONS TO RUN AT START////
$('#invModal').modal(
	{
		keyboard:true,
		show:false,
		focus:false
	});
////CHECKOUT TRIGGERS////
	$('#check-out-tab').on('click',function(){
		$.ajax({
			method: "POST",
			url: "/get-check-outs",
			data:{},
			success: function(res,status) {
				$('#all-checkouts-container').empty();
				console.log(res);
				if(res.length == 0)
				{
				}
				else
				{
					res.forEach(function(result){
						addCheckoutResult(result);
					});
					setCheckOutTriggers();
					$('#check-out-search-body').empty();
					$('#check-out-search-form').trigger('reset');
					$('#add-check-out-form').trigger('reset');
				}
			},
			error: function(err,status){
		 
			},
		});
	});
	$("#check-out-cat,#check-out-partName,#check-out-subCat,#check-out-val,#check-out-partNum,#check-out-loc").on('input',function(){
		addPartSearch();
	});
	$('#addCheckOutButton').on('click',function(){
		var formData = getFormData('#add-check-out-form');
		$('#current-check-out').children().each(function(){
			partObj = JSON.parse($(this).attr('value')); 
			delete partObj['amountCheckedOut'];
			delete partObj['loc'];
			delete partObj['notes'];
			delete partObj['qty'];
			formData[partObj._id]=JSON.stringify(partObj);
		});
		$.ajax({
			method: "POST",
			url: "/add-check-out",
			data: formData,
			success: function( res,status ) {
				$('#add-check-out-form').trigger('reset');
				$('#check-out-search-form').trigger('reset');
				$('#current-check-out').empty();
				$('#addCheckOutSuccess').fadeIn('fast',function(){
					$('#current-check-out').empty();
					$('#add-check-out-form').trigger('reset');
					$('#check-out-tab').trigger('click');
					setTimeout(function(){
						$('#addCheckOutSuccess').fadeOut('fast',function(){
						});
					},500);
				});
			},
			error: function(err,status){
			},
		});
	});
////PART MODAL////
	////MODIFY TRIGGERS////
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
				addAdminPartSearch();
            },
            error: function(err,status){
				alert('Error modifying part');
            },
        });
	});
	////MODAL TRIGGERS////
	$('#invModal').on('hidden.bs.modal',function(){
		$('#modify-form').trigger('reset');
		$('#modify-form').hide();
		$('#part-options').show();
	});
	////DELETE TRIGGERS////
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
				addAdminPartSearch();
				$("#storePart").attr('value',"");
				$("[value="+uniq_id+"]").remove();
				$("#invModal").modal('hide');
            },
            error: function(err,status){
				alert('Error deleting part');
            },
        });
	});
	$("#addQty").on('click',function(){
		var formData = getFormData('#quantity-form');
		$('#quantity-form').trigger('reset');
		partObj = JSON.parse($("#checkOutStorePart").attr('value'));
		partObj['amountToCheckOut'] = formData.amountToCheckOut;
		var valueWithQty = JSON.stringify(partObj);
		$("[value='"+$("#checkOutStorePart").attr('value')+"']").filter(".check-out-result-row").clone().addClass('cart').attr('value',valueWithQty).append("<tr'>"+formData.amountToCheckOut+"</tr>").appendTo("#current-check-out");
		assignRowClick();
		$("#qtyModal").modal('hide');
		$('#quantity-form').trigger('reset');
	});
////ADD PART TRIGGERS////
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
				
			});
			addAdminPartSearch();
			assignMouseEvents();
			assignRowClick();
		},
		error: function(err,status){
			alert('Error adding part');
		},
	});
	});
	$(".add-form-input").on('input',function(){
		addAdminPartSearch();
	});
	$('#clearAddPart').on('click',function(){
		$('#add-form').trigger('reset');
	});
});
////TO BE SORTED////
function setCheckOutTriggers()
{
	$('.check-box-all').on('click',function(){
		var _id =$(this).parent().parent().parent().parent().attr('value');
		$.ajax({
			method: "POST",
			url: "/check-in-all",
			data: {
				_id:_id
			},
			success: function( res,status ) {
				$('#all-checkouts-container').empty();
				res.forEach(function(result){
					addCheckoutResult(result);
				});
				setCheckOutTriggers();
				$('#check-out-search-body').empty();
			},
			error: function(err,status){
				alert('Error checking in order');
			},
		});
	});
	$('.check-box-part').on('click',function(){
		var part_id =$(this).parent().parent().attr('value');
		var checkOut_id=$(this).parent().parent().parent().parent().attr('value');
		$.ajax({
			method: "POST",
			url: "/check-in-part",
			data: {
				part_id:part_id,
				checkOut_id:checkOut_id
			},
			success: function( res,status ) {
				$('#all-checkouts-container').empty();
				res.forEach(function(result){
					addCheckoutResult(result);
				});
				setCheckOutTriggers();
				$('#check-out-search-body').empty();
			},
			error: function(err,status){
				alert('Error checking in part');
			},
		});
	});
	$('.plus-box').on('click',function(){
		var formData = {};
		$('#current-check-out').children().each(function(){
			partObj = JSON.parse($(this).attr('value')); 
			delete partObj['amountCheckedOut'];
			delete partObj['loc'];
			delete partObj['notes'];
			delete partObj['qty'];
			formData[partObj._id]=JSON.stringify(partObj);
		});
		formData['checkOut_id']=$(this).parent().parent().parent().parent().attr('value');
		$.ajax({
			method: "POST",
			url: "/add-part-post-check-out",
			data: formData,
			success: function( res,status ) {
				
				$('#all-checkouts-container').empty();
				res.forEach(function(result){
					addCheckoutResult(result);
					console.log(res);
				});
				setCheckOutTriggers();
				$('#check-out-search-body').empty();
			},
			error: function(err,status){
				alert('Error checking in part');
			},
		});
	});
}


