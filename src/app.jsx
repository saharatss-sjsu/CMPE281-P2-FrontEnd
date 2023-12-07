import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from 'react';
import { useCookies } from "react-cookie";

import PageError from './pages/page-error';
import PageHome from './pages/home';
import PageUserBase from './pages/user/PageUserBase';
import PageUserLogin from './pages/user/PageUserLogin';
import PageUserLogout from './pages/user/PageUserLogout';
import PageUserRegister from './pages/user/PageUserRegister';
import PageUserProfile from './pages/user/PageUserProfile';

export default function App() {
	// eslint-disable-next-line no-unused-vars
	const [cookies, setCookie, removeCookie] = useCookies(["sessionid"]);
	const [sessionID, setSessionID] = useState(null);
	const [user, setUser] = useState(null);

	let api = {};
	// api.host_backend    = `http://localhost:8000`;
	// api.host_backend    = `${window.location.protocol}//${window.location.host}`;
	api.host_backend    = 'https://license.saharatss.org';
	api.host_cloudfront = 'https://license-media.saharatss.org';
	api.session = {
		'id':sessionID, 
		'setSession':(newSessionID)=>{
			setSessionID(newSessionID);
			setCookie('sessionid', newSessionID, {sameSite: 'none', path: '/'});
			localStorage.setItem("sessionid", newSessionID);
		}, 
		'clearSession':()=>{
			setSessionID(null);
			localStorage.removeItem("sessionid");
			removeCookie('sessionid');
		}
	}
	api.request = (url, method='GET', data=null)=>{
		if(api.host_backend==null) return new Promise((resolveInner)=>{});
		return fetch(`${api.host_backend}${url}`,{
			'method':method,
			'mode': 'cors',
			'credentials': 'include',
			'headers': {
				'Access-Control-Allow-Origin': `${window.location.protocol}//${window.location.host}`,
				'Cookie': `sessionid=${api.session.id}`,
			},
			'body': data!= null ? JSON.stringify(data):null,
		})
	}
	api.user = {
		'user':user,
		'setUser':setUser,
		'fetch':()=>{
			api.request('/api/user/me/get/')
			.then(response=>{
				if(response.status===200) return response.json();
				else api.session.clearSession();
			})
			.then(data=>{
				if(data == null) return;
				setUser(data.user);
			})
		}
	}

	useEffect(() => {
		document.title = 'LieSense Checker';
		setSessionID(localStorage.getItem("sessionid"));
	}, []);

	return (
		<>
			<BrowserRouter>
				<Routes>
					<Route path="/">
						<Route index element={<PageHome api={api} />} />
						<Route path="account" element={<PageUserBase />}>
							<Route path="login" element={<PageUserLogin api={api} />} />
							<Route path="logout" element={<PageUserLogout api={api} />} />
							<Route path="register" element={<PageUserRegister api={api} />} />
							<Route path="me" element={<PageUserProfile api={api} />} />
						</Route>
						<Route path="*" element={<PageError />} />
					</Route>
				</Routes>
			</BrowserRouter>
		</>
	);
}