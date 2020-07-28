import { ICellViewModel } from '@bayesnote/common/lib/types.js';
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import React, { useEffect, useState } from 'react';
import MonacoEditor from "react-monaco-editor";
import { useTable } from 'react-table';
// @ts-ignore
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import { store } from '../store';

interface Props {
    cellVM: ICellViewModel
}

//TODO: Add a status bar for runs 
//TODO: Pretty print log. Show Run button
export const Flow: React.FC<Props> = ({ cellVM }) => {
    const url = "http://localhost:80/workflow"

    //TODO: add margin below
    return <Tabs>
        <TabList>
            <Tab>Flow</Tab>
            <Tab>Editor</Tab>
        </TabList>

        <TabPanel>
            <h2> <FlowTable /></h2>
        </TabPanel>
        <TabPanel>
            <h2>  <FlowEditor /></h2>
        </TabPanel>
    </Tabs>

    // <div style={{ width: "80%" }}>
    //     <FlowTable />
    //     <FlowEditor />
    //     <div style={{ textAlign: "right" }}>
    //         <ToolBar />
    //     </div>
    //     <div style={{ height: 400 }}>
    //         <LazyLog extraLines={1} enableSearch url={url} caseInsensitive />
    //     </div>
    // </div >
}

//TODO: this is ugly
const url = "http://localhost:80/workflow"

//This is should reside out of react-table component.
const columns = [
    {
        Header: 'Flow Name',
        accessor: 'name',
    },
    {
        Header: 'Schedule',
        accessor: 'schedule',
    },
    {
        Header: 'Status',
        accessor: 'status',
    },
    {
        Header: 'Time',
        accessor: 'time',
    }
];

//TODO: CSS 
const FlowTable: React.FC = () => {
    //TODO: logic to handle workflow
    //TODO: Group into operation
    const [data, setData] = useState([{ name: "No Flow created", schedule: "", status: "", time: "" }] as any)

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
    } = useTable({
        columns,
        data,
    });

    useEffect(() => {
        fetch(url).
            then(response => response.text()).
            then(data => "[" + data.replace(/\n/g, ",") + "]").
            then(data => JSON.parse(data)).
            then(data => setData(data))
    }, [columns, data])

    return (
        <table {...getTableProps()}>
            <thead>
                {headerGroups.map(headerGroup => (
                    <tr {...headerGroup.getHeaderGroupProps()}>
                        {headerGroup.headers.map(column => (
                            <th {...column.getHeaderProps()}>{column.render('Header')}</th>
                        ))}
                    </tr>
                ))}
            </thead>
            <tbody {...getTableBodyProps()}>
                {rows.map((row, i) => {
                    prepareRow(row)
                    return (
                        <tr {...row.getRowProps()}>
                            {row.cells.map(cell => {
                                return <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                            })}
                        </tr>
                    )
                })}
            </tbody>
        </table>
    );
}

const ToolBar: React.FC = () => {

    const handleStart = () => {
        const state = store.getState().flowReducer.flow
        console.log(state)
        const url = "http://localhost:80/workflow/wf1/start"
        fetch(url, {
            method: "POST"
        }).then(Response => console.log((Response.status)))
    }

    const handleStop = () => {
        //TODO: parse yaml to get name
        const state = store.getState().flowReducer.flow
        console.log(state)
        const url = "http://localhost:80/workflow/wf1/stop"
        fetch(url, {
            method: "POST"
        }).then(Response => console.log((Response.status)))
    }

    return <div>
        <button onClick={handleStart}>Start</button>
        <button onClick={handleStop}>Stop</button>
    </div>
}

//TODO: Remove duplicate with monaco.tsx
const FlowEditor: React.FC = () => {

    const options = {
        minimap: { enabled: false },
    }

    var model: monaco.editor.ITextModel | null

    const [height, setHeight] = useState(0)
    const [code, setCode] = useState(flowTemplate)

    const editorDidMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
        editor.focus();
        model = editor.getModel()
        if (model) {
            setHeight((model.getLineCount() + 1) * 19)
        }
    }

    const onChange = (newValue: string) => {
        if (model) {
            const contentHeight = (model.getLineCount() + 1) * 19
            setHeight((model.getLineCount() + 1) * 19)
        }
        setCode(newValue)
        store.dispatch({ type: 'updateFlow', payload: { flow: newValue } })
    }

    //TODO: disable line number
    return (
        <MonacoEditor
            height={height}
            theme="vs-dark"
            // language={cellVM.cell.language}
            value={code}
            options={options}
            onChange={onChange}
            editorDidMount={editorDidMount}
        />
    );
}

let flowTemplate = `
name: wf1
schedule: "*/5 * * * *"
image: bayesnote:latest
tasks:
    - name: nb1
      next: nb3

    - name: nb2
      next: nb3
      
    - name: nb3
`