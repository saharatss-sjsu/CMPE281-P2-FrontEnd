/* eslint-disable react-hooks/exhaustive-deps */
import './home.css';
import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";

import {
	AppLayout,
	ContentLayout,
	Table,
	Header,
	SpaceBetween,
	Button,
	Alert,
	Modal,
	ExpandableSection,
	ColumnLayout,
	FormField,
	FileUpload,
	Container,
	Box,
	Link,
	// TextFilter,
	// Pagination,
} from "@cloudscape-design/components";
import * as Icon from '@mui/icons-material';

import NavigationBar from '../components/NavigationBar';

import ServiceNavigation from '../components/ServiceNavigation';

function MatchingResultIcon({ isMatch, text=null, nullText='Unknown'}){
	return (<div style={{display:"flex", columnGap:"5px"}}>
		{isMatch == null ? <><Icon.Help fontSize="small" color="disabled" /><div style={{color:'#aaa'}}>{nullText}</div></>:<>
			{isMatch ? <Icon.CheckCircle fontSize="small" color="success" />:<Icon.Cancel fontSize="small" color="error" />}
			{isMatch ? <Box color="text-status-success">{text}</Box>:<Box color="text-status-error">{text}</Box>}
			</>}
		</div>);
}

export default function PageHome({ api }) {
	const navigate = useNavigate();
	const convertDatetimeToString = (input)=>(new Date(input)).toLocaleString('US');

	//#region alerts
	const [alerts, setAlerts] = useState([]);
	const pushAlert = (severity,message)=>{
		setAlerts([...alerts, {
			severity: severity,
			message: message,
		}]);
	}
	//#endregion
	//#region navigation
	const [navigationOpen, setNavigationOpen] = useState(false);
	function redirectToLogin(){
		navigate("/account/login", {replace: true});
	}
	//#endregion
	//#region file upload handler
	const [uploadingFile, setUploadingFile] = useState([]);
	const [textUpload, setTextUpload] = useState("Max file size 10MB.");
	function fileUploadStart(file){
		if(file == null) return;
		api.request('/api/id/matching/upload/', 'POST', {
			name: file.name,
			type: file.type,
			size: file.size
		})
		.then(response => {
			if(response.status === 200) return response.json();
			else return response.text();
		})
		.then(data => {
			if(data == null) return;
			if(typeof data === 'string'){
				pushAlert('error',data);
				return;
			}
			setTextUpload(`${file.name} is uploading...`)
			fileUploadDo(data, file).then(response => {
				if(response.status === 204){
					setTextUpload(`The image was uploaded successfully.`);
					pushAlert('success', `${file.name} uploaded successfully.`);
					fileUploadFinish(data.file.id);
					setUploadingFile([]);
					fetchMatchingList();
				}
			})
		})
	}
	function fileUploadDo(data, file){
		const formData = new FormData();
		for(const key in data?.fields) formData.append(key, data.fields[key]);
		formData.append('file', file);
		return fetch(data.url, {
			method: "POST",
			headers: {
				'Access-Control-Allow-Origin': '*',
			},
			body: formData,
		});
	}
	function fileUploadFinish(fileID){
		api.request('/api/file/upload/finish/', 'POST', {
			id: fileID,
		})
		.then(response => {
			if(response.status !== 200) pushAlert('error', response.statusText);
		})
	}
	//#endregion
	//#region matching getList
	const [matchingList, setMatchingList] = useState(null);
	const [matchingListSorting, setMatchingListSorting] = useState({
		sortingField: 'created',
		sortingDescending: true
	});
	const [matchingDetailViewing, setMatchingDetailViewing] = useState(null);

	function fetchMatchingList(){
		setMatchingList(null);
		api.request('/api/id/matching/getlist/', 'GET')
		.then(response => {
			if(response.status === 200) return response.json();
			else return response.text();
		})
		.then(data => {
			if(data == null) return;
			if(typeof data === 'string'){ pushAlert('error',data); return; }

			const matchings = data.matchings;
			matchings.sort((a,b)=>(new Date(b.created) - (new Date(a.created))));
			setMatchingList(matchings);
			initMatchingUpdateTimer(matchings);

			console.log('matchingList',matchings);
		});
	}
	//#endregion
	//#region matching update
	const [matchingUpdatingTimer_timeRamaining, setMatchingUpdatingTimer_timeRamaining] = useState(null);

	let matchingUpdatingTimer_timer = null;
	let matchingUpdatingTimer_counter = null;
	let matchingUpdatingTimer_matchingIDs = [];
	function initMatchingUpdateTimer(matchings){
		matchingUpdatingTimer_matchingIDs = [];
		matchings.forEach(matching=>{ if(matching.is_matched == null) matchingUpdatingTimer_matchingIDs.push(matching.id); });
		console.log('initMatchingUpdateTimer start',matchingUpdatingTimer_matchingIDs);
		if(matchingUpdatingTimer_matchingIDs.length === 0) return;
		clearInterval(matchingUpdatingTimer_timer);
		setMatchingUpdatingTimer_timeRamaining(5);
		matchingUpdatingTimer_counter = 5;
		matchingUpdatingTimer_timer = setInterval(async()=>{
			matchingUpdatingTimer_counter -= 1;
			setMatchingUpdatingTimer_timeRamaining((value)=>{ return value-1; }); // update the counter interface
			console.log('update in',matchingUpdatingTimer_counter);
			if(matchingUpdatingTimer_counter <= 0){
				clearInterval(matchingUpdatingTimer_timer);
				for(const matchingID of matchingUpdatingTimer_matchingIDs){
					const updatedMatching = await updateMatching(matchingID);
					if(updatedMatching != null){
						setMatchingList(matchings.map((matching)=>{
							if(matching.id!==matchingID) return matching;
							matching.driver_license   = updatedMatching.driver_license;
							matching.face_similarity  = updatedMatching.face_similarity
							matching.result_face      = updatedMatching.result_face
							matching.result_ocr       = updatedMatching.result_ocr
							matching.result_matching  = updatedMatching.result_matching
							matching.is_matched       = updatedMatching.is_matched;
							matching.resulted         = updatedMatching.resulted;
							return matching;
						}))
					}
				}
				console.log('initMatchingUpdateTimer done', matchings);
				initMatchingUpdateTimer(matchings);
			}
		}, 1000);
	}
	function updateMatching(matchingID){
		return new Promise(resolve=>{
			console.log(`update ${matchingID}`);
			api.request('/api/id/matching/get/', 'POST', {
				'id': matchingID
			})
			.then(response => {
				if(response.status === 200) return response.json();
				else return response.text();
			})
			.then(data => {
				if(data == null) return;
				if(typeof data === 'string'){ pushAlert('error',data); return; }
				const matching = data.matching;
				console.log('matching',matching);
				resolve(matching);
			});
		});
	}
	//#endregion
	//#region matching delete
  const [matchingDeletingRecord, setMatchingDeletingRecord] = useState(null);
	function deleteMatching(matchingID){
		return new Promise(resolve=>{
			api.request('/api/id/matching/delete/', 'DELETE', {
				'id': matchingID
			})
			.then(response => {
				if(response.status === 200) return response.json();
				else return response.text();
			})
			.then(data => {
				if(data == null) return;
				if(typeof data === 'string'){ pushAlert('error',data); return; }
				setMatchingList(matchingList.filter(matching=>matching.id!==matchingID));
				pushAlert('success', `The record successfully deleted`);
				resolve(data.matching);
			});
		});
	}
	//#endregion

	//#region on_load
	useEffect(()=>{
		if(api.session.id == null){
			redirectToLogin();
			return;
		}
		if(api.user.user == null){
			api.user.fetch();
		}
		fetchMatchingList();
	}, []);
	//#endregion

	return (
		<div className="App">
			<NavigationBar user={api.user.user} />

			<Modal header="Delete a record" visible={matchingDeletingRecord!=null} onDismiss={()=>{ setMatchingDeletingRecord(null); }} footer={
				<Box float="right">
					<SpaceBetween direction="horizontal" size="xs">
						<Button variant="link" 
							onClick={()=>{ setMatchingDeletingRecord(null); }}
							disabled={matchingDeletingRecord?.deleting}
							>Cancel</Button>
						<Button variant="primary"
							onClick={()=>{
								setMatchingDeletingRecord({...matchingDeletingRecord, 'deleting':true});
								deleteMatching(matchingDeletingRecord?.matching.id).then(matching=>{
									matchingDeletingRecord?.onSuccess();
								});
							}}
							loading={matchingDeletingRecord?.deleting}
							>Delete</Button>
					</SpaceBetween>
				</Box>
			}>
				<SpaceBetween direction="vertical" size="s">
					<div>Are you sure you want to delete the record</div>
					<div>
						<Box variant="awsui-key-label">Driver license</Box>
						<div>{matchingDeletingRecord?.matching.driver_license}</div>
					</div>
					<div>
						<Box variant="awsui-key-label">Verification</Box>
						<div><MatchingResultIcon isMatch={matchingDeletingRecord?.matching.is_matched} text={matchingDeletingRecord?.matching.is_matched?"Valid":"Invalid"}/></div>
					</div>
					<div>
						<Box variant="awsui-key-label">Created</Box>
						<div>{convertDatetimeToString(matchingDeletingRecord?.matching.created)}</div>
					</div>
				</SpaceBetween>
			</Modal>

			<AppLayout
				headerSelector='#navbar'
				toolsHide={true}
				navigationHide={true}
				navigation={<ServiceNavigation/>}
				navigationOpen={navigationOpen}
				onNavigationChange={({detail}) => setNavigationOpen(detail.open)}
				// ariaLabels={appLayoutLabels}
				maxContentWidth={800}
				content={<>
					<ContentLayout header={<Header variant="h1">License Verification</Header>}>
						<SpaceBetween direction="vertical" size="l">
							{matchingDetailViewing ? (
								<Container header={<Header variant="h2">Verification Detail</Header>} >
									<SpaceBetween direction="vertical" size="m">
										<Button variant="primary" iconName="arrow-left" onClick={()=>{ setMatchingDetailViewing(null); }}>Go back</Button>
										<ExpandableSection headerText="Result" defaultExpanded>
											<ColumnLayout columns={1} variant="text-grid">
												<div>
													<Box variant="awsui-key-label">Face</Box>
													<div><MatchingResultIcon isMatch={matchingDetailViewing.result_matching?.face_similarity} text={`Similarity ${matchingDetailViewing.face_similarity?.toFixed(2)}%`} /></div>
												</div>
											</ColumnLayout>
											<ColumnLayout columns={2} variant="text-grid">
												<div>
													<Box variant="awsui-key-label">Driver license</Box>
													<div><MatchingResultIcon isMatch={matchingDetailViewing.result_matching?.driver_license} text={matchingDetailViewing.driver_license??"-"}/></div>
												</div>
												<div>
													<Box variant="awsui-key-label">Vehicle class</Box>
													<div><MatchingResultIcon isMatch={matchingDetailViewing.result_matching?.vehicle_class} text={matchingDetailViewing.result_ocr?.vehicle_class?.TextValue??"-"}/></div>
												</div>
												<div>
													<Box variant="awsui-key-label">First name</Box>
													<div><MatchingResultIcon isMatch={matchingDetailViewing.result_matching?.first_name} text={matchingDetailViewing.result_ocr?.first_name?.TextValue??"-"} /></div>
												</div>
												<div>
													<Box variant="awsui-key-label">Last name</Box>
													<div><MatchingResultIcon isMatch={matchingDetailViewing.result_matching?.last_name} text={matchingDetailViewing.result_ocr?.last_name?.TextValue??"-"} /></div>
												</div>
												<div>
													<Box variant="awsui-key-label">Date of Birth</Box>
													<div><MatchingResultIcon isMatch={matchingDetailViewing.result_matching?.date_of_birth} text={matchingDetailViewing.result_ocr?.date_of_birth?.TextValue??"-"} /></div>
												</div>
												<div>
													<Box variant="awsui-key-label">Expiration Date</Box>
													<div><MatchingResultIcon isMatch={matchingDetailViewing.result_matching?.expiration_date} text={matchingDetailViewing.result_ocr?.expiration_date?.TextValue??"-"} /></div>
												</div>
												<div>
													<Box variant="awsui-key-label">Hair</Box>
													<div><MatchingResultIcon isMatch={matchingDetailViewing.result_matching?.hair} text={matchingDetailViewing.result_ocr?.hair?.TextValue??"-"} /></div>
												</div>
												<div>
													<Box variant="awsui-key-label">Eyes</Box>
													<div><MatchingResultIcon isMatch={matchingDetailViewing.result_matching?.eyes} text={matchingDetailViewing.result_ocr?.eyes?.TextValue??"-"} /></div>
												</div>
												<div>
													<Box variant="awsui-key-label">Height</Box>
													<div><MatchingResultIcon isMatch={matchingDetailViewing.result_matching?.height} text={matchingDetailViewing.result_ocr?.height?.TextValue??"-"} /></div>
												</div>
												<div>
													<Box variant="awsui-key-label">Weight</Box>
													<div><MatchingResultIcon isMatch={matchingDetailViewing.result_matching?.weight} text={matchingDetailViewing.result_ocr?.weight?.TextValue??"-"} /></div>
												</div>
											</ColumnLayout>
										</ExpandableSection>
										<ExpandableSection headerText="Image" defaultExpanded>
											<img src={`${api.host_cloudfront}/${matchingDetailViewing.image.path}`} style={{width:"100%"}} alt='' />
										</ExpandableSection>
										<ExpandableSection headerText="Debug (OCR)" defaultExpanded>
											<img src={`${api.host_cloudfront}/user_upload/debug/${matchingDetailViewing.image.name}`} style={{width:"100%"}} alt='' />
										</ExpandableSection>
										<ExpandableSection headerText="Action" defaultExpanded>
											<br />
											<Button iconName="delete-marker" onClick={()=>{ setMatchingDeletingRecord({
												matching: matchingDetailViewing,
												onSuccess: ()=>{
													setMatchingDetailViewing(null);
													setMatchingDeletingRecord(null);
												}
											}); }}>Delete the record</Button>
										</ExpandableSection>
									</SpaceBetween>
								</Container>
							):(<>
							<Container header={<Header variant="h2">Upload a License</Header>} >
								<SpaceBetween direction="vertical" size="m">

									{/* Section: Alert */}
									{alerts.map((alert, index)=>
										<Alert
											onDismiss={() => {setAlerts(alerts.filter((x => x!==alert)));}}
											dismissAriaLabel="Close alert"
											dismissible
											type={alert.severity}
											header={alert.severity.toUpperCase()}
										>
											{alert.message}
										</Alert>
									)}

									{/* Section: Upload */}
									<FormField stretch description="Upload ID card image for verification.">
										<FileUpload
											onChange={({ detail }) => { setUploadingFile(detail.value); fileUploadStart(detail.value[0]); }}
											value={uploadingFile}
											i18nStrings={{
												uploadButtonText: e =>
													e ? "Choose files" : "Choose file",
												dropzoneText: e =>
													e
														? "Drop files to upload"
														: "Drop file to upload",
												removeFileAriaLabel: e =>
													`Remove file ${e + 1}`,
												limitShowFewer: "Show fewer files",
												limitShowMore: "Show more files",
												errorIconAriaLabel: "Error"
											}}
											showFileLastModified
											showFileSize
											showFileThumbnail
											tokenLimit={1}
											constraintText={textUpload}
											accept='image/jpeg,image/png'
										/>
									</FormField>
								</SpaceBetween>
							</Container>
							<Table header={<Header variant="h2">History</Header>}
								columnDefinitions={[
									{
										id: "driver_license",
										header: "Driver License",
										cell: item => <Button variant="inline-link" onClick={()=>{ setMatchingDetailViewing(item); }}>{
											item.driver_license.includes('$null') ? 'Verifying...':(item.driver_license === '' ? '(unknown)':item.driver_license)
											}</Button>
									},
									{
										id: "full_name",
										header: "Name",
										cell: item => <div>{item.result_ocr?.first_name?.TextValue??"-"} {item.result_ocr?.last_name?.TextValue??"-"}</div>,
									},
									{
										id: "created",
										header: "Created",
										cell: item => convertDatetimeToString(item.created),
										// sortingField: "created"
									},
									{
										id: "resulted",
										header: "Verified",
										cell: item => convertDatetimeToString(item.resulted),
									},
									{
										id: "is_matched",
										header: "Result",
										cell: item => <MatchingResultIcon isMatch={item.is_matched} text={item.is_matched?"Valid":"Invalid"} nullText={`Verifying...${matchingUpdatingTimer_timeRamaining}s`} />
									},
									{
										id: "actions",
										header: "Actions",
										cell: item => <SpaceBetween direction="horizontal" size="l">
											<Button variant="inline-link" onClick={()=>{ setMatchingDetailViewing(item); }}>View</Button>
											{/* <Button variant="inline-link" onClick={()=>{ setMatchingDetailViewing(item); }}>Delete</Button> */}
										</SpaceBetween>,
									}
								]}
								columnDisplay={[
									{ id: "is_matched", visible: true },
									{ id: "driver_license", visible: true },
									{ id: "full_name", visible: true },
									{ id: "created", visible: true },
									{ id: "resulted", visible: true },
									{ id: "actions", visible: true },
								]}
								items={matchingList??[]}
								loading={matchingList==null}
								loadingText="Loading resources"
								sortingColumn={matchingListSorting}
								sortingDescending={matchingListSorting.sortingDescending}
								onSortingChange={(event)=>{
									setMatchingListSorting({...matchingListSorting, 'sortingDescending':event.detail.isDescending});
									matchingList.sort((a,b)=>(new Date(a.created) - (new Date(b.created)))*(event.detail.isDescending?-1:1));
								}}
								trackBy="id"
								empty={
									<Box
										margin={{ vertical: "xs" }}
										textAlign="center"
										color="inherit"
									>
										<SpaceBetween size="m">
											<b>No resources</b>
										</SpaceBetween>
									</Box>
								}
								// filter={
								// 	<TextFilter
								// 		filteringPlaceholder="Find resources (not yet functional)"
								// 		filteringText=""
								// 	/>
								// }
								// pagination={
								// 	<Pagination currentPageIndex={1} pagesCount={2} />
								// }
								/>
							</>)}
						</SpaceBetween>
					</ContentLayout>

				</>}
			/>
		</div>
	);
}