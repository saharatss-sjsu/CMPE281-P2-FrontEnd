import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";

import '@aws-amplify/ui-react/styles.css';

import {
	Flex,
	Card,
	Button,
	TextField,
	PasswordField,
	Heading,
} from '@aws-amplify/ui-react';

import {
	Form
} from 'react-bootstrap';

export default function PageUserLogin({ api }) {
	const [formdata, setFormdata] = useState({});
	const [errorMsg, setErrorMsg] = useState("");

	const navigate = useNavigate();

	const handleChange = (event) => {
		const name  = event.target.name;
		const value = event.target.value;
		setFormdata(values => ({...values, [name]: value}))
	}
	const handleSubmit = async (event) => {
		event.preventDefault();
		try{
			const response = await api.request('/api/user/login/', 'POST', formdata)
			const data = await response.json();
			if(response.status === 200){
				api.user.setUser(data.user);
				api.session.setSession(data.sessionid);
			}
			else if(response.status === 401){
				setErrorMsg(data.msg);
			}
		}catch(error){ alert(error) } 
	}
	const getSessionID = async ()=>{
		const response = await api.request('/api/user/me/get/', 'GET')
		const data = await response.json();
		if(response.status === 200){
			api.user.setUser(data.user);
			api.session.setSession(data.sessionid);
		}
	}

	useEffect(() => {
		if(api.session.id != null) navigate("/");
		else{
			getSessionID();
		}
	}, [api.session.id])

	return (
		<>
			<Card variation="elevated">
				<Form onSubmit={handleSubmit}>
					<Flex direction="column">
						<Heading width='30vw' level={4}>LieSense Checker</Heading>
						<TextField
							label="Username"
							name="username"
							placeholder="Enter your Username"
							errorMessage="There is an error"
							defaultValue={formdata.username || ""}
							onChange={handleChange} autoFocus
						/>
						<PasswordField
							label="Password"
							name="password"
							placeholder="Enter your Username"
							errorMessage={errorMsg}
							hasError={errorMsg !== ""}
							defaultValue={formdata.password || ""}
							onChange={handleChange}
						/>
						<Button variation="primary" type='submit' className='w-100 mt-3'>Sign in</Button>
					</Flex>
				</Form>
			</Card>
		</>
	);
}