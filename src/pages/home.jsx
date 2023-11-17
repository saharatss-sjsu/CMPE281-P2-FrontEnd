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
	FormField,
	FileUpload,
	Container,
	Box,
	TextFilter,
	Pagination,
} from "@cloudscape-design/components";

import NavigationBar from '../components/NavigationBar';

import ServiceNavigation from '../components/ServiceNavigation';

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
	const [uploadingIDNumber, setUploadingIDNumber] = useState("");
	const [uploadingFile, setUploadingFile] = useState([]);
	const [textUpload, setTextUpload] = useState("Max file size 10MB.");
	function fileUploadStart(file, driver_license){
		if(file == null) return;
		api.request('/api/id/matching/upload/', 'POST', {
			driver_license: driver_license,
			image:{
				name: file.name,
				type: file.type,
				size: file.size
			}
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
					setTextUpload(`${driver_license} image uploaded successfully.`);
					pushAlert('success', `${file.name} uploaded successfully.`);
					fileUploadFinish(data.file.id);
					setUploadingFile([]);
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
	//#region history
	// const [historyList, setHistoryList] = useState([]);
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
	}, [api.session]);
	//#endregion

	return (
		<div className="App">
			<NavigationBar user={api.user.user} />

			<AppLayout
				headerSelector='#navbar'
				navigation={<ServiceNavigation/>}
				navigationOpen={navigationOpen}
				onNavigationChange={({detail}) => setNavigationOpen(detail.open)}
				// ariaLabels={appLayoutLabels}
				maxContentWidth={800}
				content={<>
					
					<ContentLayout header={<Header variant="h1">License Verification</Header>}>
						<SpaceBetween direction="vertical" size="l">
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
									<FormField stretch label="Step 1" description="Driver license number">
										<Input
											autoFocus
											placeholder="e.g. A12345678"
											value={uploadingIDNumber}
											onChange={event => { setUploadingIDNumber(event.detail.value); }}
										/>
									</FormField>
									<FormField stretch label="Step 2" description="Upload a card image">
										<FileUpload
											onChange={({ detail }) => { setUploadingFile(detail.value); fileUploadStart(detail.value[0], uploadingIDNumber); }}
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

							{/* Section: History */}
							<Table
								header={<Header variant="h2">History</Header>}
								columnDefinitions={[
									{
										id: "variable",
										header: "Variable name",
										cell: item => <Link href="#">{item.name}</Link>,
										sortingField: "name",
										isRowHeader: true
									},
									{
										id: "value",
										header: "Text value",
										cell: item => item.alt,
										sortingField: "alt"
									},
									{
										id: "type",
										header: "Type",
										cell: item => item.type
									},
									{
										id: "description",
										header: "Description",
										cell: item => item.description
									}
								]}
								columnDisplay={[
									{ id: "variable", visible: true },
									{ id: "value", visible: true },
									{ id: "type", visible: true },
									{ id: "description", visible: true }
								]}
								items={[
									{
										name: "Item 1",
										alt: "First",
										description: "This is the first item",
										type: "1A",
										size: "Small"
									},
									{
										name: "Item 2",
										alt: "Second",
										description: "This is the second item",
										type: "1B",
										size: "Large"
									},
									{
										name: "Item 3",
										alt: "Third",
										description: "-",
										type: "1A",
										size: "Large"
									},
									{
										name: "Item 4",
										alt: "Fourth",
										description: "This is the fourth item",
										type: "2A",
										size: "Small"
									},
									{
										name: "Item 5",
										alt: "-",
										description:
											"This is the fifth item with a longer description",
										type: "2A",
										size: "Large"
									},
									{
										name: "Item 6",
										alt: "Sixth",
										description: "This is the sixth item",
										type: "1A",
										size: "Small"
									}
								]}
								loadingText="Loading resources"
								selectionType="multi"
								trackBy="name"
								empty={
									<Box
										margin={{ vertical: "xs" }}
										textAlign="center"
										color="inherit"
									>
										<SpaceBetween size="m">
											<b>No resources</b>
											<Button>Create resource</Button>
										</SpaceBetween>
									</Box>
								}
								filter={
									<TextFilter
										filteringPlaceholder="Find resources (not yet functional)"
										filteringText=""
									/>
								}
								pagination={
									<Pagination currentPageIndex={1} pagesCount={2} />
								}
							/>
						</SpaceBetween>
					</ContentLayout>

				</>}
			/>
		</div>
	);
}