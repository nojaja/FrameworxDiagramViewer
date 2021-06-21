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
```
CREATE TABLE TAM (ID PRIMARY KEY, LEVEL integer, PARENT , NAME , TYPE , ORIGINAL_ID , DESCRIPTION , FUNCTION , BRIEF_DESCRIPTION , DOMAIN , CATEGORY , MATURITY_LEVEL , FRAMEWORX_STATUS );
CREATE TABLE ETOM (ID PRIMARY KEY, LEVEL integer, PARENT , NAME , TYPE , ORIGINAL_ID , DESCRIPTION , FUNCTION , BRIEF_DESCRIPTION , DOMAIN , CATEGORY , MATURITY_LEVEL , FRAMEWORX_STATUS );

CREATE TABLE ODA_Functional_Blocks (ID PRIMARY KEY, LEVEL integer, PARENT , NAME , TYPE , ORIGINAL_ID , DESCRIPTION , FUNCTION , BRIEF_DESCRIPTION , DOMAIN , CATEGORY , MATURITY_LEVEL , FRAMEWORX_STATUS );
```

3. insert Data
```
https://docs.google.com/spreadsheets/d/1tONFHSG063GqTjbpQe-8XtLZh-zazxqr3T9b1gTPMUU/edit?usp=sharing
https://docs.google.com/spreadsheets/d/1cp_RM2HgvJQa1mxKcuwfQjgU51xM05jYYSMKmw8WZmc/edit?usp=sharing
https://docs.google.com/spreadsheets/d/1rKSNk4ptMRMJbI8rO7SDvRuTBoiLTHcD8xb-_m9UcMY/edit?usp=sharing
```

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
