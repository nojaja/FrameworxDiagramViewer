# FrameworxDiagramViewer

[![Licence](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE) 


## Feature
* TreeViewer
 * GB929F_Functional_Framework_Functional_Decomposition_v21.0.0
 * GB921_Business_Process_Framework_Processes_v21.0.0
 * GB1022_ODA_Functional_Architecture_Guidebook_v1.1.0

## Live Demo


## Screenshot

## Development
1. init
```sh
$ npm install
```

2. init DB
[TABLES](https://docs.google.com/spreadsheets/d/1P4WQxQnO-gbPkVZ2d85T9I0dClw9Lm3rQ_cvSmyYz88/edit?usp=sharing)
```
CREATE TABLE TAM (ID PRIMARY KEY, LEVEL integer, PARENT , NAME , TYPE , ORIGINAL_ID , DESCRIPTION , FUNCTION , BRIEF_DESCRIPTION , , DOMAIN , CATEGORY , MATURITY_LEVEL , FRAMEWORX_STATUS );

CREATE TABLE ETOM (ID PRIMARY KEY, LEVEL integer, PARENT , NAME , TYPE , ORIGINAL_ID , DESCRIPTION , FUNCTION , BRIEF_DESCRIPTION , , DOMAIN , CATEGORY , MATURITY_LEVEL , FRAMEWORX_STATUS );

CREATE TABLE ODA_Functional_Blocks (ID PRIMARY KEY, LEVEL integer, PARENT , NAME , TYPE , ORIGINAL_ID , DESCRIPTION , FUNCTION , BRIEF_DESCRIPTION , , DOMAIN , CATEGORY , MATURITY_LEVEL , FRAMEWORX_STATUS );

CREATE TABLE End_to_End_Business_Flows (ID PRIMARY KEY, LEVEL integer, PARENT , NAME , TYPE , ORIGINAL_ID , DESCRIPTION , FUNCTION , BRIEF_DESCRIPTION , ASSUMPTIONS , DOMAIN , CATEGORY , MATURITY_LEVEL , FRAMEWORX_STATUS );

CREATE TABLE Open_APIs (ID PRIMARY KEY, LEVEL integer, PARENT , NAME , TYPE , FUNCID , CATEGORY , DESCRIPTION , FUNCTION , MATURITY_LEVEL , SWAGGER , SPECIFICATION , CONFORMANCE_PROFILE , CTK , SAMPLE IMPLEMENTATION CODE , POSTMAN COLLECTION , RELEASE , VERSION , LIFECYCLE STATUS );

CREATE TABLE Legacy_Systems (ID PRIMARY KEY, LEVEL integer, PARENT , NAME , TYPE , FUNCID , CATEGORY , DESCRIPTION , FUNCTION , MATURITY_LEVEL , DEV_OWNER , OPE_OWNER , SYSTEM_OWNER , SYSTEM_DOCUMENT );
```

3. insert Data
[GB929F_Application_Framework_Functional_Decomposition_v21.0](https://docs.google.com/spreadsheets/d/1cp_RM2HgvJQa1mxKcuwfQjgU51xM05jYYSMKmw8WZmc/edit?usp=sharing)  
[GB921_Business_Process_Framework_Processes_v21.0](https://docs.google.com/spreadsheets/d/1tONFHSG063GqTjbpQe-8XtLZh-zazxqr3T9b1gTPMUU/edit?usp=sharing)  
[GB921E_End_to_End_Business_Flows_v20.0.1](https://docs.google.com/spreadsheets/d/1Bf-ZWoKFnIdlczZ6U0uIjGth8E-Krb2_0gB9skkMs3w/edit?usp=sharing)  
[GB1022_ODA_Functional_Architecture_Guidebook_v1.1.0](https://docs.google.com/spreadsheets/d/1rKSNk4ptMRMJbI8rO7SDvRuTBoiLTHcD8xb-_m9UcMY/edit?usp=sharing)  
[Open_APIs](https://docs.google.com/spreadsheets/d/1rYSE8yqqOCIfLxa8LlfjQfRCbhf8LNjrjjMaQXak6Ws/edit?usp=sharing)  
[Legacy_Systems](https://docs.google.com/spreadsheets/d/1P4WQxQnO-gbPkVZ2d85T9I0dClw9Lm3rQ_cvSmyYz88/edit?usp=sharing)  
[mapping](https://docs.google.com/spreadsheets/d/1Qr4PD75e1VRMx_4Lk09ibswxMdJakM-TKNvpWBcHNtI/edit?usp=sharing)  

4. start
```sh
$ npm start
```

5. open browser
```
http://localhost:8080
```

## License

Licensed under the [MIT](LICENSE) License.
