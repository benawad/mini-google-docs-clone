import React, { useState, useRef, useEffect } from "react";
import { Editor } from "slate-react";
import { initialValue } from "./slateInitialValue";
import io from "socket.io-client";
import { Operation, Value, ValueJSON } from "slate";

const socket = io("http://localhost:4000");

interface Props {}

export const SyncingEditor: React.FC<Props> = () => {
  const [value, setValue] = useState(initialValue);
  const id = useRef(`${Date.now()}`);
  const editor = useRef<Editor | null>(null);
  const remote = useRef(false);

  useEffect(() => {
    socket.once("init-value", (value: ValueJSON) => {
      setValue(Value.fromJSON(value));
    });

    socket.emit("send-value");

    socket.on(
      "new-remote-operations",
      ({ editorId, ops }: { editorId: string; ops: Operation[] }) => {
        if (id.current !== editorId) {
          remote.current = true;
          ops.forEach((op: any) => editor.current!.applyOperation(op));
          remote.current = false;
        }
      }
    );

    return () => {
      socket.off("new-remote-operations");
    };
  }, []);

  return (
    <Editor
      ref={editor}
      style={{
        backgroundColor: "#fafafa",
        maxWidth: 800,
        minHeight: 150
      }}
      value={value}
      onChange={opts => {
        setValue(opts.value);

        const ops = opts.operations
          .filter(o => {
            if (o) {
              return (
                o.type !== "set_selection" &&
                o.type !== "set_value" &&
                (!o.data || !o.data.has("source"))
              );
            }

            return false;
          })
          .toJS()
          .map((o: any) => ({ ...o, data: { source: "one" } }));

        if (ops.length && !remote.current) {
          socket.emit("new-operations", {
            editorId: id.current,
            ops,
            value: opts.value.toJSON()
          });
        }
      }}
    />
  );
};
