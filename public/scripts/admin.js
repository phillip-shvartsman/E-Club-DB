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
			$('#check-out-search-body').empty();
			if(res.length == 0)
			{
			}
			else
			{
				if(res.length>15)
				{
					res = res.splice(0,15);
				}
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
	for(var key in data)
	{
		if(typeof(data[key])=='string'&&data[key]!="")
		{
			newValue = data[key];
			newValue = newValue.replace(/'/g, "");
			newValue = newValue.replace(/"/g, "");
			data[key] = newValue;
		}
	}
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
	toPrint = Object.assign({},result);
	delete toPrint['fname'];
	delete toPrint['lname'];
	delete toPrint['_id'];
	delete toPrint['dateDue'];
	delete toPrint['dNum'];
	delete toPrint['fNum'];
	delete toPrint['checkedIn'];
	if(Object.keys(toPrint).length==1)
	{
		check_part = "";
	}
	for(var key in toPrint)
	{
		jsonData = JSON.parse(toPrint[key]);
		entry = "<tr class='checked-out-part' value='"+jsonData['_id']+"'><td>"+jsonData['amountToCheckOut']+"</td><td>"+jsonData['partName']+"</td><td>"+jsonData['partNum']+"</td><td>"+jsonData['val']+"</td><td>"+jsonData['loc']+"</td><td>"+check_part+"</td></tr>";
		$("[value="+result['_id']+"]").find('tbody').append(entry);
	} 
}
$(document).ready(function(){
$('.filter').on('input',function(){
	var formData = getFormData('#filter-checkouts');
	$('#all-checkouts-container').children().each(function(){
		var fnameReg = new RegExp(formData['fname'],"i")
		var lnameReg = new RegExp(formData['lname'],"i")
		var dNumReg = new RegExp(formData['dNum'],"i")
		var fnumReg = new RegExp(formData['fNum'],"i")
		var fnameVal = $(this).attr('fname').search(fnameReg);
		var lnameVal = $(this).attr('lname').search(lnameReg);
		var dNumVal = $(this).attr('dnum').search(dNumReg);
		var fnumVal = $(this).attr('fnum').search(fnumReg);
		var sum = fnameVal + lnameVal + dNumVal + fnumVal;
		if(sum>=0)
		{
			$(this).css("display","");
		}
		else
		{
			$(this).css("display","none");
		}
	});
});
////FUNCTIONS TO RUN AT START////
$('#invModal').modal(
	{
		keyboard:true,
		show:false,
		focus:false
	});
	$('#search-tab').on('click',function(){
		$('#search-table-body').empty();
	});
////LOGOUT TRIGGER////
$('#logout').on('click',function(){
	$.ajax({
			method: "GET",
			url: "/logout",
			data:{},
			success: function(res,status) {
				location.reload();
			},
			error: function(err,status){
			},
		});
})
////CHECKOUT TRIGGERS////
	$('#check-out-tab').on('click',function(){
		$.ajax({
			method: "POST",
			url: "/get-check-outs",
			data:{},
			success: function(res,status) {
				$('#all-checkouts-container').empty();
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
		if(formData['fname']==""||formData['lname']==""||formData['dNum']==""||formData['fNum']==""||formData['dateDue']=="")
		{
			errorFlash('Missing Information about the person checking out!');
			return;
		}
		var numParts = $('#current-check-out').children().length;
		if(numParts==0)
		{
			errorFlash('No items in current check out cart!');
			return;
		}
		$('#current-check-out').children().each(function(){
			partObj = JSON.parse($(this).attr('value')); 
			delete partObj['amountCheckedOut'];
			delete partObj['notes'];
			delete partObj['qty'];
			formData[partObj._id]=JSON.stringify(partObj);
		});
		$.ajax({
			method: "POST",
			url: "/add-check-out",
			data: formData,
			success: function( res,status ) {
				successFlash('Added that check-out!')
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
				successFlash('Part was modified!');
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
		var partObj = JSON.parse($("#storePart").attr('value'));
		var uniq_id = partObj._id;
		$.confirm({
			title: 'Confirmation',
			content: 'Confirm delete part?',
			buttons: {
				confirm: function () {
					$.ajax({
						method: "POST",
						url: "/delete",
						data: {
							_id : uniq_id
						},
						success: function( res,status ) {
							successFlash('Part was deleted!')
							addAdminPartSearch();
							$("#storePart").attr('value',"");
							$("[value="+uniq_id+"]").remove();
							$("#invModal").modal('hide');
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
	$("#addQty").on('click',function(){
		var formData = getFormData('#quantity-form');
		if(formData['amountToCheckOut']<=0)
		{
			errorFlash('Invalid amount to check out.');
			return;
		}
		$('#quantity-form').trigger('reset');
		partObj = JSON.parse($("#checkOutStorePart").attr('value'));
		partObj['amountToCheckOut'] = formData.amountToCheckOut;
		var valueWithQty = JSON.stringify(partObj);
		$("[value='"+$("#checkOutStorePart").attr('value')+"']").filter(".check-out-result-row").clone().removeClass('check-out-result-row').addClass('cart').attr('value',valueWithQty).append("<tr'>"+formData.amountToCheckOut+"</tr>").appendTo("#current-check-out");
		assignRowClick();
		$("#qtyModal").modal('hide');
		$('#quantity-form').trigger('reset');
		$('#check-out-search-form').trigger('reset');
		$('#check-out-search-body').empty();
	});
////ADD PART TRIGGERS////
	$("#addPart").on("click", function(){
	var data = getFormData('#add-form');
	if(data['loc']==""||data['partName']==""||data['qty']==""||data['cat']=="")
	{
		errorFlash('Must have at least a part name, category, location, and quantity!');
		return;
	}
	$.ajax({
		method: "POST",
		url: "/add",
		data: data,
		success: function( res,status ) {
			successFlash('Part was added!')
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
		addAdminPartSearch();
	});
});
function successFlash(message)
{
	$('#successFlash').html("<strong>Success!</strong> "+message);
	$('#successFlash').fadeIn('fast',function(){
		setTimeout(function(){
			$('#successFlash').fadeOut('fast',function(){
			});
		},1000);
	});
}
function errorFlash(error)
{
	$('#errorFlash').html("<strong>Error!</strong> "+error);
	$('#errorFlash').fadeIn('fast',function(){
		setTimeout(function(){
			$('#errorFlash').fadeOut('fast',function(){
			});
		},1000);
	});
}
////TO BE SORTED////
function setCheckOutTriggers()
{
	$('.check-box-all').on('click',function(){
		var _id =$(this).parent().parent().parent().parent().attr('value');
		$.confirm({
			title: 'Confirmation',
			content: 'Confirm this whole check in?',
			buttons: {
				confirm: function () {
					$.ajax({
						method: "POST",
						url: "/check-in-all",
						data: {
							_id:_id
						},
						success: function( res,status ) {
							successFlash('Checked in all of the parts!');
							$('#all-checkouts-container').empty();
							res.forEach(function(result){
								addCheckoutResult(result);
							});
							setCheckOutTriggers();
							$('#check-out-search-body').empty();
							$('.filter').trigger('input');
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
	$('.check-box-part').on('click',function(){
		var part_id =$(this).parent().parent().attr('value');
		var checkOut_id=$(this).parent().parent().parent().parent().attr('value');
		$.confirm({
			title: 'Confirmation',
			content: 'Confirm this part checkout',
			buttons: {
				confirm: function () {
				$.ajax({
					method: "POST",
					url: "/check-in-part",
					data: {
						part_id:part_id,
						checkOut_id:checkOut_id
					},
					success: function( res,status ) {
						successFlash('Checked in that part!');
						$('#all-checkouts-container').empty();
						res.forEach(function(result){
							addCheckoutResult(result);
						});
						setCheckOutTriggers();
						$('#check-out-search-body').empty();
						$('.filter').trigger('input');
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
	$('.plus-box').on('click',function(){
		var formData = {};
		$('#current-check-out').children().each(function(){
			partObj = JSON.parse($(this).attr('value')); 
			delete partObj['amountCheckedOut'];
			delete partObj['notes'];
			delete partObj['qty'];
			formData[partObj._id]=JSON.stringify(partObj);
		});
		if(Object.keys(formData).length==0)
		{
			errorFlash('Your current check out is empty!')
			return;
		}
		formData['checkOut_id']=$(this).parent().parent().parent().parent().attr('value');
		//No items in the cart
		$.confirm({
			title: 'Confirmation',
			content: 'Confirm this part addition',
			buttons: {
				confirm: function () {
					$.ajax({
						method: "POST",
						url: "/add-part-post-check-out",
						data: formData,
						success: function( res,status ) {
							successFlash('Added those parts!');
							$('#all-checkouts-container').empty();
							res.forEach(function(result){
								addCheckoutResult(result);
							});
							setCheckOutTriggers();
							$('#check-out-search-body').empty();
							$('.filter').trigger('input');
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


