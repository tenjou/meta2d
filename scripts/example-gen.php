<?php

if($handle = opendir("../examples/features")) 
{
	$html = '<!DOCTYPE html><html><head><title>META examples</title></head><body><ul>';

    while (false !== ($entry = readdir($handle))) 
    {
    	if($entry == "." || $entry == ".." || $entry == ".DS_Store") { 
    		continue;
    	}

    	$html .= '<li><a href="features/'.$entry.'">'.$entry.'</li>';
    }

    $html .= "</ul></body>";

    file_put_contents("../examples/index.html", $html);

    closedir($handle);
}

?>