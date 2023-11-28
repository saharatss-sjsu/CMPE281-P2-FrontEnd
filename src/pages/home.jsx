import './home.css';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from "react-router-dom";

import {
	AppLayout,
	ContentLayout,
	Table,
	Header,
	SpaceBetween,
	Button,
	Input,
	Alert,
	Link,
	ExpandableSection,
	ColumnLayout,
	FormField,
	FileUpload,
	Container,
	Box,
	TextFilter,
	Pagination,
} from "@cloudscape-design/components";
import * as Icon from '@mui/icons-material';

import NavigationBar from '../components/NavigationBar';

import ServiceNavigation from '../components/ServiceNavigation';

function MatchingResultIcon({ isMatch, text=null }){
	return (<div style={{display:"flex", columnGap:"5px"}}>
		{isMatch == null ? <><Icon.Help fontSize="small" color="disabled" /><div style={{color:'#aaa'}}>Verifying...</div></>:<>
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
	//#region matchingList
	const [matchingDetailViewing, setMatchingDetailViewing] = useState(null);
	const [matchingList, setMatchingList] = useState(null);
	const [matchingListSorting, setMatchingListSorting] = useState({
		sortingField: 'created',
		sortingDescending: true
	});
	function fetchMatchingList(){
		setMatchingList(null);
		api.request('/api/id/matching/getlist/', 'GET')
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
			data.matchings.sort((a,b)=>(new Date(b.created) - (new Date(a.created))));
			setMatchingList(data.matchings);
			console.log(data.matchings);
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
	}, [api.session]);
	//#endregion

	return (
		<div className="App">
			<NavigationBar user={api.user.user} />

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
										<Button variant="primary" onClick={()=>{ setMatchingDetailViewing(null); }}>Go back</Button>
										<ExpandableSection headerText="Image" defaultExpanded>
											<img src={`${api.host_cloudfront}/${matchingDetailViewing.image.path}`} style={{width:"100%"}} alt='' />
										</ExpandableSection>
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
													<div><MatchingResultIcon isMatch={matchingDetailViewing.driver_license.includes('$null') ? null:true} text={matchingDetailViewing.driver_license}/></div>
												</div>
												<div>
													<Box variant="awsui-key-label">Vehicle class</Box>
													<div><MatchingResultIcon isMatch={matchingDetailViewing.result_matching?.vehicle_class} text={matchingDetailViewing.result_ocr?.vehicle_class.TextValue??"-"}/></div>
												</div>
												<div>
													<Box variant="awsui-key-label">First name</Box>
													<div><MatchingResultIcon isMatch={matchingDetailViewing.result_matching?.first_name} text={matchingDetailViewing.result_ocr?.first_name.TextValue??"-"} /></div>
												</div>
												<div>
													<Box variant="awsui-key-label">Last name</Box>
													<div><MatchingResultIcon isMatch={matchingDetailViewing.result_matching?.last_name} text={matchingDetailViewing.result_ocr?.last_name.TextValue??"-"} /></div>
												</div>
											</ColumnLayout>
										</ExpandableSection>
										<ExpandableSection headerText="Debug (OCR)">
											<img src={`${api.host_cloudfront}/user_upload/debug/${matchingDetailViewing.image.name}`} style={{width:"100%"}} alt='' />
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
										/>
									</FormField>
								</SpaceBetween>
							</Container>
							<Table
								header={<Header variant="h2">History</Header>}
								columnDefinitions={[
									{
										id: "driver_license",
										header: "Driver License",
										cell: item => item.driver_license,
									},
									{
										id: "created",
										header: "Created",
										// cell: item => <Link key={item.id} href="#">{(new Date(item.created)).toLocaleString('US')}</Link>,
										cell: item => (new Date(item.created)).toLocaleString('US'),
										sortingField: "created"
									},
									{
										id: "resulted",
										header: "Verified",
										cell: item => (new Date(item.resulted)).toLocaleString('US'),
									},
									{
										id: "is_matched",
										header: "Result",
										cell: item => <MatchingResultIcon isMatch={item.is_matched} text={item.is_matched?"Valid":"Invalid"} />
									},
									{
										id: "actions",
										header: "Actions",
										cell: item => <SpaceBetween direction="horizontal" size="xxs">
											<Button variant="inline-link" onClick={()=>{ setMatchingDetailViewing(item); }}>View</Button>
										</SpaceBetween>,
									}
								]}
								columnDisplay={[
									// { id: "driver_license", visible: true },
									{ id: "created", visible: true },
									{ id: "resulted", visible: true },
									{ id: "is_matched", visible: true },
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