import { WidgetProps } from "@rjsf/core";
import { DropzoneOptions, useDropzone } from "react-dropzone";
import React, { useCallback, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  ImageList,
  ImageListItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { Delete, FileUpload, Preview } from "@mui/icons-material";
import OutputMedias from "./OutputComponents/OutputMedias";

interface FileUploadWidgetInterface {
  widget: WidgetProps;
  multiple: boolean;
  supportType: "image" | "audio" | "video" | "file";
}

const fileToBase64 = (file: File) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

const fileSizeToReadable = (size: number) => {
  const units = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  let l = 0;
  let n = size;
  while (n >= 1024) {
    n /= 1024;
    l++;
  }
  return `${n.toFixed(n < 10 && l > 0 ? 1 : 0)} ${units[l]}`;
};

const FileUploadWidget = (props: FileUploadWidgetInterface) => {
  const [files, setFiles] = React.useState<File[]>([]);
  const [open, setOpen] = React.useState(false);
  const [preview, setPreview] = React.useState<string>("");
  const [previewType, setPreviewType] = React.useState<string>("");
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  let dropzoneConfig: DropzoneOptions = !props.multiple
    ? { multiple: false, maxFiles: 1 }
    : { multiple: true, maxFiles: 0 };

  switch (props.supportType) {
    case "image":
      dropzoneConfig = { ...dropzoneConfig, accept: { "image/*": [] } };
      break;
    case "audio":
      dropzoneConfig = { ...dropzoneConfig, accept: { "audio/*": [] } };
      break;
    case "video":
      dropzoneConfig = { ...dropzoneConfig, accept: { "video/*": [] } };
      break;
  }

  dropzoneConfig = {
    ...dropzoneConfig,
    onDrop: useCallback(
      (acceptedFiles: File[]) => {
        if (props.multiple) {
          setFiles([...files, ...acceptedFiles]);
        } else {
          setFiles([...acceptedFiles]);
        }
      },
      [files]
    ),
  };

  const { acceptedFiles, getRootProps, getInputProps } =
    useDropzone(dropzoneConfig);

  useEffect(() => {
    if (files.length > 0) {
      if (props.multiple) {
        Promise.all(files.map((file) => fileToBase64(file))).then((values) => {
          props.widget.onChange(values);
        });
      } else {
        fileToBase64(files[0]).then((value) => {
          props.widget.onChange(value);
        });
      }
    }
  }, [acceptedFiles]);

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  const removeAllFiles = () => {
    setFiles([]);
  };

  const fileString = props.multiple
    ? `${props.supportType}s`
    : props.supportType;

  return (
    <>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="lg">
        <DialogTitle>Media Preview</DialogTitle>
        <DialogContent>
          <OutputMedias
            medias={preview}
            type={previewType}
            backend={""}
            outline={true}
          />
        </DialogContent>
        <DialogActions
          sx={{
            width: "100%",
            paddingRight: 2.5,
          }}
        >
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Delete All?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to delete all {fileString}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              removeAllFiles();
              setConfirmOpen(false);
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      <Stack
        direction="column"
        alignItems="center"
        justifyContent="center"
        sx={{ width: "100%" }}
        spacing={2}
      >
        <Paper
          sx={{
            width: "100%",
            cursor: "pointer",
          }}
          variant="outlined"
          {...getRootProps({ className: "dropzone" })}
        >
          <Stack
            direction="column"
            alignItems="center"
            justifyContent="center"
            spacing={2}
          >
            <input {...getInputProps()} />
            <Typography variant="body2">
              Drag and drop some {fileString} here, or click to select{" "}
              {fileString}
            </Typography>
            <FileUpload fontSize="large" />
            <Typography variant="caption">
              {files.length} {fileString} selected
            </Typography>
            <br />
          </Stack>
        </Paper>
        {files.length !== 0 && (
          <>
            {files.filter((file) => file.type.startsWith("image")).length !==
              0 && (
              <ImageList
                variant="masonry"
                cols={3}
                gap={8}
                sx={{ width: "100%" }}
              >
                {files
                  .filter((file) => file.type.startsWith("image"))
                  .map((item) => (
                    <ImageListItem key={item.name}>
                      <img
                        src={URL.createObjectURL(item)}
                        alt={item.name}
                        title={item.name}
                        loading="lazy"
                        onClick={() => {
                          setPreview(URL.createObjectURL(item));
                          setPreviewType(item.type);
                          setOpen(true);
                        }}
                      />
                    </ImageListItem>
                  ))}
              </ImageList>
            )}
            <TableContainer component={Paper}>
              <Table
                sx={{
                  width: "100%",
                }}
                size="small"
              >
                <TableHead>
                  <TableRow>
                    <TableCell>File Name</TableCell>
                    <TableCell>File Size</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {files.map((file, index) => {
                    return (
                      <TableRow key={index}>
                        <TableCell
                          align="left"
                          sx={{
                            minWidth: "50%",
                          }}
                        >
                          {file.name}
                        </TableCell>
                        <TableCell align="left">
                          {fileSizeToReadable(file.size)}
                        </TableCell>
                        <TableCell align="left">
                          <IconButton
                            size="small"
                            onClick={() => {
                              removeFile(index);
                            }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                          {(file.type.startsWith("image") ||
                            file.type.startsWith("video") ||
                            file.type.startsWith("audio") ||
                            file.type === "application/pdf") && (
                            <IconButton
                              size="small"
                              onClick={() => {
                                fileToBase64(file).then((value) => {
                                  setPreview(value as string);
                                  setPreviewType(file.type);
                                  setOpen(true);
                                });
                              }}
                            >
                              <Preview fontSize="small" />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
                <TableFooter>
                  <TableCell>
                    <Button
                      color="error"
                      startIcon={<Delete />}
                      onClick={() => {
                        setConfirmOpen(true);
                      }}
                      size="small"
                    >
                      Delete All
                    </Button>
                  </TableCell>
                </TableFooter>
              </Table>
            </TableContainer>
          </>
        )}
      </Stack>
    </>
  );
};

export default FileUploadWidget;